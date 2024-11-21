/*
  Warnings:

  - A unique constraint covering the columns `[name,department,organisation]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Room_name_department_organisation_key" ON "Room"("name", "department", "organisation");
