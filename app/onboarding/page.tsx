"use client";
import React, { useEffect, useState } from "react";
import { Button, Progress } from "antd";
import Illustration from "../components/OnBoardingProcess/Illustration";
import LogoHeader from "../components/OnBoardingProcess/LogoHeader";
import Form1 from "../components/OnBoardingProcess/Forms/Form1";
import Form2 from "../components/OnBoardingProcess/Forms/Form2";
import Form3 from "../components/OnBoardingProcess/Forms/Form3";
import ConfirmPage from "../components/OnBoardingProcess/Forms/ConfirmPage";
import { OrganisationSchema } from "../types/main";
import { IoIosArrowBack } from "react-icons/io";
import { FaChevronRight } from "react-icons/fa";

const totalPageNumbers = 3;

const Page = () => {
  const [pageNumber, setPageNumber] = useState(0);
  const progressPercentage = Math.round((pageNumber / totalPageNumbers) * 100);
  const [organisationDetails, setOrganisationDetails] =
    useState<OrganisationSchema>({
      name: "",
      designation: "",
      dept: "",
      sections: 0,
      teachers: 0,
      students: 0,
      depts_list: [],
    });

  const [backBtnDisable, setBackBtnDisable] = useState(false);

  // Disable back button when user is at pageNumber 0
  useEffect(() => {
    if (pageNumber <= 0) setBackBtnDisable(true);
    else if (backBtnDisable == true) {
      setBackBtnDisable(false);
    }
  }, [pageNumber]);

  const continueBtnDisableConditions = [
    // Reached End
    () => pageNumber >= 3,
    // Form 1 Condition
    () =>
      pageNumber == 0 &&
      (organisationDetails.name == "" ||
        organisationDetails.dept == "" ||
        organisationDetails.designation == ""),
    // Form 2 Condition
    () =>
      pageNumber == 1 &&
      (organisationDetails.sections == 0 ||
        organisationDetails.students == 0 ||
        organisationDetails.teachers == 0),
    // Form 3 Condition
    () => pageNumber == 2 && organisationDetails.depts_list.length == 0,
  ];

  const continueBtnEnable = continueBtnDisableConditions.reduce(
    (acc, curr) => curr() || acc,
    false
  );

  return (
    <main className="grid grid-cols-2 h-screen">
      <div className="py-4 px-8 flex flex-col space-y-6">
        <LogoHeader />
        <Progress percent={progressPercentage} strokeColor="#636AE8FF" />
        <div className="flex flex-col space-y-12 pr-12">
          <h1 className="font-bold text-2xl">Organization Registration</h1>
          {(() => {
            switch (pageNumber) {
              case 0:
                return (
                  <Form1
                    setOrganisationDetails={setOrganisationDetails}
                    organisationDetails={organisationDetails}
                  />
                );
              case 1:
                return (
                  <Form2
                    setOrganisationDetails={setOrganisationDetails}
                    organisationDetails={organisationDetails}
                  />
                );
              case 2:
                return (
                  <Form3
                    setOrganisationDetails={setOrganisationDetails}
                    organisationDetails={organisationDetails}
                  />
                );
              default:
                return <ConfirmPage setBackBtnDisable={setBackBtnDisable} />;
            }
          })()}
        </div>
        <div className="flex justify-between pr-12">
          <Button
            disabled={backBtnDisable}
            onClick={() => setPageNumber((p) => p - 1)}
            className="bg-[#F3F4F6FF] rounded-xl"
          >
            <IoIosArrowBack />
            <h1>Back</h1>
          </Button>
          <Button
            onClick={() => setPageNumber((p) => p + 1)}
            className="bg-primary text-white rounded-xl py-4"
            disabled={continueBtnEnable}
          >
            <h1>Continue</h1>
            <FaChevronRight />
          </Button>
        </div>
      </div>
      <Illustration />
    </main>
  );
};

export default Page;
