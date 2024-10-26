import { useNavigate } from "react-router-dom";
import { Logo } from "../../svgs/logoSVG";
import styles from "./message.module.css";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import Chat from "./Chat";
import LoginContext from "../../context/context";
import { LuLogIn, LuLogOut } from "react-icons/lu";

function LoaderRipple() {
  return (
    <div className={styles["lds-ripple"]}>
      <div></div>
      <div></div>
    </div>
  );
}

function Message() {
  const [chatId, setChatId] = useState(null);
  const navigate = useNavigate();
  const { logout, loggedIn } = useContext(LoginContext);
  const mainRef = useRef();
  const [chat, setChat] = useState([]);
  const [chatState, setChatState] = useState("busy");
  const [chatInit, setChatInit] = useState(false);
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false); // State to handle listening status
  let ws = useRef(null);
  let isConnected = useRef(false); // Connection status flag
  let retryTimeout = useRef(null); // Timeout for reconnecting
  let recognitionRef = useRef(null); // Ref for speech recognition instance

  // Determine WebSocket URL based on environment (local or production)
  const getWebSocketUrl = useCallback(() => {
    const localUrl = `ws://localhost:8802?id=${chatId}`;
    const productionUrl = `wss://mindmate-ws.onrender.com?id=${chatId}`;
    return process.env.NODE_ENV === "development" ? localUrl : productionUrl;
  }, [chatId]);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (chatId === null) return;

    const wsUrl = getWebSocketUrl();
    ws.current = new WebSocket(wsUrl);

    ws.current.addEventListener("open", () => {
      console.log("WebSocket connected");
      isConnected.current = true;
      clearTimeout(retryTimeout.current);

      ws.current.send(JSON.stringify({ type: "client:connected" }));
      ws.current.send(JSON.stringify({ type: "client:chathist" }));
    });

    ws.current.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data?.type === "server:chathist") {
        const histdata = data?.data;
        if (!histdata) return;

        for (let conv of histdata) {
          if (conv.prompt) {
            setChat((prevchat) => [
              ...prevchat,
              { message: conv.prompt, own: true },
            ]);
          }
          if (conv.response) {
            setChat((prevchat) => [
              ...prevchat,
              { message: conv.response, own: false },
            ]);
          }
        }

        setChatState("idle");
        setChatInit(true);
      } else if (data?.type === "server:response:chunk") {
        setChat((prevchat) => {
          return [
            ...prevchat.slice(0, -1),
            {
              message: `${prevchat.at(prevchat.length - 1).message}${data.chunk}`,
              own: false,
              isLoading: true,
            },
          ];
        });
      } else if (data?.type === "server:response:end") {
        setChat((prevchat) => {
          return [
            ...prevchat.slice(0, -1),
            {
              message: prevchat.at(prevchat.length - 1).message,
              own: false,
              isLoading: false,
            },
          ];
        });
        setChatState("idle");
      }
    });

    ws.current.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.current.addEventListener("close", (event) => {
      isConnected.current = false;
      console.log(`WebSocket closed: Code = ${event.code}, Reason = ${event.reason}`);
      retryConnection();
    });
  }, [chatId, getWebSocketUrl]);

  const retryConnection = () => {
    if (!isConnected.current) {
      console.log("Attempting to reconnect in 3 seconds...");
      retryTimeout.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  };

  // Initialize WebSocket and fetch chatId
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await axios.get(process.env.REACT_APP_API_LINK + "/chat", {
          withCredentials: true,
        });
        setChatId(data.data.chatId);
        console.log(data);
      } catch (error) {
        console.log("Error Fetching Data");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (chatId !== null) {
      connectWebSocket();
    }
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [chatId, connectWebSocket]);

  const handleClick = () => {
    if (!isConnected.current) {
      console.log("WebSocket is not connected");
      return;
    }

    setChat((prevchat) => [...prevchat, { message, own: true }]);

    ws.current.send(
      JSON.stringify({
        type: "client:prompt",
        prompt: message,
      })
    );

    setMessage("");
    setChatState("busy");

    setChat((prevchat) => [
      ...prevchat,
      { message: "", own: false, isLoading: true },
    ]);
  };

  // Initialize speech recognition and handle transcription
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported.");
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = false; // Stop after a single phrase
    recognitionRef.current.interimResults = false; // Do not show interim results
    recognitionRef.current.lang = "en-US"; // Set language

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript); // Set the transcribed message
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.log("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const logoutUser = async () => {
    try {
      const { data } = await axios.get(
        process.env.REACT_APP_API_LINK + "/logout",
        {
          withCredentials: true,
        }
      );
      console.log(data);
      if (data?.msg === "loggedout") {
        logout();
      }
    } catch (error) {
      console.log("Err in logout");
    }
  };

  return (
    <div className={styles.messageContainer}>
      <header>
        <div className={styles.logoContainer} onClick={() => navigate('/')}>
          <Logo />
          <div className={styles.headerText}>
            <h4>ZenMate</h4>
            <h6>A mental health chat assistance</h6>
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <button
            onClick={() => {
              if (!loggedIn) navigate("/login");
              else {
                navigate("/analysis");
              }
            }}
          >
            Analyse
          </button>

          <button
            onClick={() => {
              if (!loggedIn) navigate("/login");
              else {
                logoutUser();
              }
            }}
          >
            {!loggedIn ? <LuLogIn /> : <LuLogOut />}
          </button>
        </div>
      </header>
      <main
        ref={mainRef}
        style={
          !chatInit || chat.length === 0
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : {}
        }
      >
        {!chatInit && (
          <div className={styles.loadingChatInit}>
            <LoaderRipple />
          </div>
        )}
        {chatInit && chat.length === 0 && (
          <div className={styles.emptyChat}>
            No Previous Chat History!
            <br />
            Chat with me now.
          </div>
        )}
        {chatInit &&
          chat.map((x, i) => {
            return (
              <Chat
                text={x.message}
                own={x.own}
                key={i}
                isLoading={x.isLoading ? true : false}
              />
            );
          })}
      </main>
      <footer>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={chatState === "busy"}
          />
          
          <button
            type="button"
            onClick={startListening}
            disabled={chatState === "busy" || isListening}
          >
            {isListening ? "Listening................................................................" : "🎤 Record"}
          </button>

          <button
            type="submit"
            disabled={chatState === "busy"}
          >
            <span className="ml-4 material-symbols-outlined">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
}

export default Message;
