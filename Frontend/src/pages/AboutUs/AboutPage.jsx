import React, { useEffect, useState } from "react";
import style from "./AboutPage.module.css";
import axios from "axios";
import aac from "../../Images/team.jpeg";
import ContributorCard from "./ContributorCard";

export default function AboutPage() {
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    async function fetchContributors() {
      try {
        const response = await axios.get(
          "https://api.github.com/repos/AbhiJay1287/ZenMate/contributors"
        );
        setContributors(response.data);
      } catch (error) {
        console.error("Error fetching contributors:", error);
      }
    }

    fetchContributors();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className={style.about}>
      <div className={`${style.responsivecontainerblock} ${style.bigContainer}`}>
        <div
          className={`${style.responsivecontainerblock} ${style.container} ${style.bottomContainer}`}
        >
          <div className={`${style.allText} ${style.bottomText}`}>
            <p className={style.headingText}>About Us</p>
            <p className={style.subHeadingText}>We Are Team C15</p>
            <p className={style.description}>
            Welcome to our mental health chat assistant platform, crafted with care by Abhinav, Shyam, Kiran, and Tanush. We’re here to support you every step of the way – a compassionate community where our empathetic AI listens, encourages, and provides helpful resources. This platform was thoughtfully built using the MERN tech stack, with Generative AI to offer tailored assistance, and WebSocket ensuring seamless, real-time communication with the Gemini API. We’ve also utilized Tailwind CSS to create a user-friendly and visually appealing interface, while Node and Express.js power the backend to keep everything running smoothly.
            <br/>
            <br/>

Together, we’re fostering an open space where understanding, encouragement, and mental well-being take center stage. You’re never alone on this journey – we stand with you, ready to offer support as you navigate through. Let’s continue to build a space where connection and empathy thrive.
            </p>
            <a
              href="https://www.youtube.com/watch?v=O3BUHwfHf84"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className={style.explore}>View More</button>
            </a>
          </div>

          {/* Team Image replacing the YouTube Video */}
          <div className={style.videoContainer}>
            <img
              src={aac}
              className={style.mainVideo} // Keeps the same styles as the YouTube iframe
              alt="Team Image"
            />
            <img
              className={`${style.dotsImg} image-block`}
              src="https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/cw3.svg"
              alt="Decorative dots"
            />
          </div>
        </div>
      </div>

      <div className={style.contributors}>
        <center><h1>Meet Our Team</h1></center>
        {/* <div className={style.contributorsGrid}>
          {contributors.map((contributorData) => (
            <ContributorCard
              key={contributorData.id}
              contributor={contributorData}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
}
