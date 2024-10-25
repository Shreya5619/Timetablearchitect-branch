import { Button } from "antd";
import React from "react";
import Avatar1 from "@/public/Avatars/avatar1.png";
import Avatar2 from "@/public/Avatars/avatar2.png";
import Image from "next/image";
import Scrum from '@/public/Illustrations/Scrum.png'
const HeroSection = () => {
  return (
    <div className="py-16 flex flex-col items-center">
      <div className="flex justify-around w-full">
        <Image className="w-20 h-20" alt="Avatar2" src={Avatar2} />
        <h1 className="text-5xl font-bold">Timetable Architect</h1>
        <Image className="w-20 h-20" alt="Avatar1" src={Avatar1} />
      </div>
      <div className="flex flex-col items-center space-y-10">
      <p className="text-gray-600 text-lg text-center px-96">
        Timetable Architect is a smart tool that helps schools and colleges
        create timetables by assigning classes to teachers based on their
        availability. It optimizes the schedule to avoid conflicts and make the
        best use of time and resources.
      </p>
      <Button className="bg-primary px-10 w-fit text-lg py-6 text-white font-bold">
        Get Started
      </Button>
      </div>
      <Image src={Scrum} className="w-[540px] h-[380px]" alt="Scrum"/>
    </div>
  );
};

export default HeroSection;