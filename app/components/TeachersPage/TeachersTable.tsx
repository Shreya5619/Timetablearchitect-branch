"use client";
import React, { useMemo, useState } from "react";
import { Avatar, Button, ConfigProvider, Input, Select, Table, Tooltip } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { MdDelete, MdEdit } from "react-icons/md";
import { Teacher } from "@/app/types/main";
import { deleteTeachers } from "@/lib/actions/teacher";
import { statusCodes } from "@/app/types/statusCodes";
import { toast } from "sonner";
import { TbTrash } from "react-icons/tb";
import { DEPARTMENTS_OPTIONS } from "@/info";
import { CiSearch } from "react-icons/ci";

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const colorCombos: Record<string, string>[] = [
  { textColor: "#FFFFFF", backgroundColor: "#000000" },
  { textColor: "#333333", backgroundColor: "#FFFBCC" },
  { textColor: "#1D3557", backgroundColor: "#A8DADC" },
  { textColor: "#F2F2F2", backgroundColor: "#00796B" },
  { textColor: "#FFFFFF", backgroundColor: "#283593" },
  { textColor: "#FFFFFF", backgroundColor: "#2C3E50" },
  { textColor: "#000000", backgroundColor: "#F2F2F2" },
  { textColor: "#F2F2F2", backgroundColor: "#424242" },
  { textColor: "#000000", backgroundColor: "#F4E04D" },
  { textColor: "#2F4858", backgroundColor: "#F8B400" },
];

const deptColors: Record<string, string> = {};
let cnt = 0;

const columns: TableColumnsType<Teacher> = [
  {
    title: "Avatar",
    dataIndex: "name",
    render: (text: string) => {
      return (
        <Avatar
          className="text-xl"
          style={{ backgroundColor: getRandomColor(), verticalAlign: "middle" }}
          size="large"
        >
          {text.slice(0, 1)}
        </Avatar>
      );
    },
  },
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Initials",
    dataIndex: "initials",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Department",
    dataIndex: "department",
    render: (dept: string) => {
      return (
        <h1
          style={{
            backgroundColor: deptColors[dept],
            color: colorCombos.find(
              (combo) => combo.backgroundColor === deptColors[dept]
            )?.textColor,
          }}
          className="text-xs opacity-85 font-semibold w-fit px-2.5 py-0.5 rounded-xl"
        >
          {dept}
        </h1>
      );
    },
  },
  {
    title: "",
    render: () => {
      return (
        <Tooltip title="Edit">
          <Button type="primary" shape="circle" icon={<MdEdit />} />
        </Tooltip>
      );
    },
  },
  {
    title: "",
    render: () => {
      return (
        <Tooltip title="Delete">
          <Button
            className="bg-red-400"
            type="primary"
            shape="circle"
            icon={<MdDelete />}
          />
        </Tooltip>
      );
    },
  },
];


const TeachersTable = ({ teachersData, setTeachersData }: { teachersData: Teacher[], setTeachersData: React.Dispatch<React.SetStateAction<Teacher[]>> }) => {
  console.log(setTeachersData)
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([])
  const [departmentFilter, setDepartmentFilter] = useState("Select a department");

  function clearFilters() {
    setDepartmentFilter("Select a department");
  }

  const rowSelection: TableProps<Teacher>["rowSelection"] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Teacher[]) => {
      setSelectedTeachers(selectedRows)
    },
    getCheckboxProps: (record: Teacher) => ({
      disabled: record.name === "Disabled User",
      name: record.name,
    }),
  };

  function deleteTeachersHandler() {
    if (selectedTeachers.length == 0) {
      toast.info("Select teachers to delete !!");
      return;
    }
    console.log(selectedTeachers)
    const res = deleteTeachers(localStorage.getItem('token') || "", selectedTeachers).then((res) => {
      const statusCode = res.status;
      console.log(res)
      switch (statusCode) {
        case statusCodes.OK:
          toast.success("Teachers deleted successfully");
          break;
      }
    })

    toast.promise(res, {
      loading: "Deleting teachers ..."
    })
  }

  teachersData?.forEach((teacher) => {
    if (!deptColors[teacher.department as string]) {
      deptColors[teacher.department as string] =
        colorCombos[cnt % colorCombos.length].backgroundColor;
      cnt++;
    }
  });


  const filteredTeachersData = useMemo(() => {
    if (departmentFilter == "Select a department") {
      return teachersData;
    }

    const new_teachers = teachersData.filter((t) => t.department == departmentFilter)
    return new_teachers;
  }, [departmentFilter])




  // Add a unique key to each teacher record (email is assumed to be unique)
  const dataWithKeys = filteredTeachersData.map((teacher) => ({
    ...teacher,
    key: teacher.email, // Use email as the unique key
  }));

  return (
    <div>
      <div className="flex space-x-8 justify-between py-4">
        <Input
          className="w-fit"
          addonBefore={<CiSearch />}
          placeholder="Teacher"
        />

        {/* this config to set background color of the selectors | did as specified in antd docs */}
        <ConfigProvider
          theme={{
            components: {
              Select: {
                selectorBg: "#F3F4F6FF",
              },
            },
          }}
        >
          <div className="flex space-x-3">
            <Select
              defaultValue="Sort By"
              style={{ width: 120 }}
              options={[]}
            />
            <Select
              className="w-[300px]"
              defaultValue="All Departments"
              value={departmentFilter}
              options={DEPARTMENTS_OPTIONS}
              onChange={(e) => setDepartmentFilter(e)}
            />
          </div>
        </ConfigProvider>
        <div className="flex space-x-2">
          <Button onClick={deleteTeachersHandler} className="bg-red-500 text-white font-bold">
            <TbTrash />
            Delete
          </Button>
          <Button onClick={clearFilters}>Clear filters</Button>
        </div>
      </div>



      <Table<Teacher>
        rowSelection={{ type: "checkbox", ...rowSelection }}
        columns={columns}
        dataSource={dataWithKeys}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default TeachersTable;
