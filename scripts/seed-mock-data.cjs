const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Run this command with node --env-file=.env.');
}

const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const seeded = {};
  const now = new Date();

  async function insertOnce(table, key, values) {
    const keyFields = Array.isArray(key) ? key : [key];
    const existing = await client.query(
      `SELECT 1 FROM ${quote(table)} WHERE ${keyFields.map((field, index) => `${quote(field)} = $${index + 1}`).join(' AND ')} LIMIT 1`,
      keyFields.map((field) => values[field]),
    );

    if (existing.rowCount) {
      return;
    }

    const data = { ...values, createdAt: now, updatedAt: now };
    const columns = Object.keys(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await client.query(
      `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${placeholders.join(', ')})`,
      columns.map((column) => data[column]),
    );
    seeded[table] = (seeded[table] || 0) + 1;
  }

  const passwordHash = await bcrypt.hash('Demo@2026!', 12);
  const demoUsers = [
    ['teacher.demo@preskool.local', 'Ms. Leila Hassan', 'TEACHER'],
    ['parent.demo@preskool.local', 'Omar Al Mansoori', 'PARENT'],
    ['staff.demo@preskool.local', 'Maya Rahman', 'STAFF'],
  ];

  for (const [email, fullName, role] of demoUsers) {
    await insertOnce('users', 'email', {
      fullName,
      email,
      passwordHash,
      role,
      isActive: true,
      twoStepEnabled: false,
      emailVerified: true,
    });
  }

  const students = [
    ['STU-2026-001', 'Aisha', 'Al Mansoori', 'aisha.al.mansoori@example.test', '0501000001', 'FEMALE', 'Grade 1', 'A', 'Omar Al Mansoori', '0502000001'],
    ['STU-2026-002', 'Yousef', 'Hassan', 'yousef.hassan@example.test', '0501000002', 'MALE', 'Grade 1', 'A', 'Hassan Ali', '0502000002'],
    ['STU-2026-003', 'Mariam', 'Khalid', 'mariam.khalid@example.test', '0501000003', 'FEMALE', 'Grade 1', 'B', 'Khalid Saeed', '0502000003'],
    ['STU-2026-004', 'Adam', 'Rahman', 'adam.rahman@example.test', '0501000004', 'MALE', 'Grade 2', 'A', 'Maya Rahman', '0502000004'],
    ['STU-2026-005', 'Noor', 'Ahmed', 'noor.ahmed@example.test', '0501000005', 'FEMALE', 'Grade 2', 'A', 'Ahmed Faris', '0502000005'],
    ['STU-2026-006', 'Zayd', 'Salem', 'zayd.salem@example.test', '0501000006', 'MALE', 'Grade 2', 'B', 'Salem Omar', '0502000006'],
  ];

  for (const [admissionNo, firstName, lastName, email, phone, gender, className, section, guardianName, guardianPhone] of students) {
    await insertOnce('students', 'admissionNo', {
      admissionNo, firstName, lastName, email, phone, gender,
      dateOfBirth: new Date('2019-05-12'), className, section, guardianName, guardianPhone,
      address: 'Dubai, United Arab Emirates', status: 'ACTIVE',
    });
  }

  for (const [fullName, email, phone, relation, occupation] of [
    ['Omar Al Mansoori', 'omar.almansoori@example.test', '0502000001', 'FATHER', 'Engineer'],
    ['Hassan Ali', 'hassan.ali@example.test', '0502000002', 'FATHER', 'Accountant'],
    ['Khalid Saeed', 'khalid.saeed@example.test', '0502000003', 'FATHER', 'Business owner'],
    ['Maya Rahman', 'maya.rahman@example.test', '0502000004', 'MOTHER', 'Designer'],
  ]) {
    await insertOnce('parents', 'email', { fullName, email, phone, relation, occupation, address: 'Dubai, United Arab Emirates', status: 'ACTIVE' });
  }

  for (const [fullName, email, phone, relation] of [
    ['Fatima Al Mansoori', 'fatima.almansoori@example.test', '0503000001', 'AUNT'],
    ['Saeed Hassan', 'saeed.hassan@example.test', '0503000002', 'GRANDFATHER'],
  ]) {
    await insertOnce('guardians', 'email', { fullName, email, phone, relation, occupation: 'Retired', address: 'Dubai, United Arab Emirates', status: 'ACTIVE' });
  }

  const teachers = [
    ['TCH-001', 'Ms. Leila Hassan', 'leila.hassan@example.test', '0504000001', 'FEMALE', 'English'],
    ['TCH-002', 'Mr. Samir Nasser', 'samir.nasser@example.test', '0504000002', 'MALE', 'Mathematics'],
    ['TCH-003', 'Ms. Rania Adel', 'rania.adel@example.test', '0504000003', 'FEMALE', 'Science'],
  ];

  for (const [employeeNo, fullName, email, phone, gender, subject] of teachers) {
    await insertOnce('teachers', 'employeeNo', {
      employeeNo, fullName, email, phone, gender, subject, qualification: 'Bachelor of Education',
      joiningDate: new Date('2024-08-20'), address: 'Dubai, United Arab Emirates', status: 'ACTIVE',
    });
  }

  for (const [departmentCode, departmentName, headOfDepartment] of [
    ['DEP-ACA', 'Academic Affairs', 'Ms. Leila Hassan'],
    ['DEP-ADM', 'Administration', 'Maya Rahman'],
    ['DEP-FIN', 'Finance', 'Hassan Ali'],
  ]) {
    await insertOnce('departments', 'departmentCode', { departmentCode, departmentName, headOfDepartment, phone: '042000000', email: `${departmentCode.toLowerCase()}@preskool.local`, location: 'Main Building', description: `${departmentName} department`, status: 'ACTIVE' });
  }

  for (const [designationCode, designationName, departmentCode, departmentName] of [
    ['DES-ADM', 'School Administrator', 'DEP-ADM', 'Administration'],
    ['DES-ACC', 'Accountant', 'DEP-FIN', 'Finance'],
    ['DES-LIB', 'Librarian', 'DEP-ACA', 'Academic Affairs'],
  ]) {
    await insertOnce('designations', 'designationCode', { designationCode, designationName, departmentCode, departmentName, description: `${designationName} role`, status: 'ACTIVE' });
  }

  const staff = [
    ['STF-001', 'Maya Rahman', 'maya.staff@example.test', '0505000001', 'FEMALE', 'DEP-ADM', 'Administration', 'DES-ADM', 'School Administrator', 'FULL_TIME', 9500],
    ['STF-002', 'Hassan Ali', 'hassan.staff@example.test', '0505000002', 'MALE', 'DEP-FIN', 'Finance', 'DES-ACC', 'Accountant', 'FULL_TIME', 8500],
    ['STF-003', 'Nadia Karim', 'nadia.staff@example.test', '0505000003', 'FEMALE', 'DEP-ACA', 'Academic Affairs', 'DES-LIB', 'Librarian', 'PART_TIME', 5000],
  ];

  for (const [staffCode, fullName, email, phone, gender, departmentCode, departmentName, designationCode, designation, employmentType, salary] of staff) {
    await insertOnce('staffs', 'staffCode', { staffCode, fullName, email, phone, gender, departmentCode, departmentName, designationCode, designation, employmentType, joiningDate: new Date('2024-08-20'), salary, address: 'Dubai, United Arab Emirates', status: 'ACTIVE' });
  }

  for (const [holidayCode, title, startDate, endDate, holidayType] of [
    ['HOL-2026-EID', 'Eid Al Fitr Holiday', '2026-03-20', '2026-03-22', 'PUBLIC'],
    ['HOL-2026-NAT', 'National Day', '2026-12-02', '2026-12-03', 'PUBLIC'],
  ]) {
    await insertOnce('holidays', 'holidayCode', { holidayCode, title, startDate: new Date(startDate), endDate: new Date(endDate), holidayType, description: `${title} closure`, status: 'ACTIVE' });
  }

  for (const [leaveCode, staffCode, staffName, departmentCode, departmentName, designationCode, designation, leaveType, startDate, endDate, totalDays, status] of [
    ['LEV-2026-001', 'STF-001', 'Maya Rahman', 'DEP-ADM', 'Administration', 'DES-ADM', 'School Administrator', 'ANNUAL', '2026-06-15', '2026-06-17', 3, 'APPROVED'],
    ['LEV-2026-002', 'STF-003', 'Nadia Karim', 'DEP-ACA', 'Academic Affairs', 'DES-LIB', 'Librarian', 'SICK', '2026-09-15', '2026-09-15', 1, 'PENDING'],
  ]) {
    await insertOnce('staff_leaves', 'leaveCode', { leaveCode, staffCode, staffName, departmentCode, departmentName, designationCode, designation, leaveType, startDate: new Date(startDate), endDate: new Date(endDate), totalDays, reason: 'Mock leave request', status, approvedBy: status === 'APPROVED' ? 'System Administrator' : null, remarks: 'Seeded sample' });
  }

  for (const [staffCode, staffName, department, designation, status] of staff.map(([code, name, , , , , dept, , title]) => [code, name, dept, title, 'PRESENT'])) {
    await insertOnce('staff_attendance', 'staffCode', { staffCode, staffName, department, designation, attendanceDate: new Date('2026-09-13'), status, remarks: 'On time' });
  }

  for (const [index, student] of students.entries()) {
    const [admissionNo, firstName, lastName, , , , className, section] = student;
    await insertOnce('student_attendance', 'attendanceCode', { attendanceCode: `ATT-STU-${String(index + 1).padStart(3, '0')}`, studentAdmissionNo: admissionNo, studentName: `${firstName} ${lastName}`, className, section, attendanceDate: new Date('2026-09-13'), status: index === 2 ? 'LATE' : 'PRESENT', checkInTime: index === 2 ? '08:20' : '07:50', checkOutTime: '13:30', remarks: index === 2 ? 'Arrived late' : null });
  }

  for (const [index, [teacherEmployeeNo, teacherName, , , , subject]] of teachers.entries()) {
    await insertOnce('teacher_attendance', 'attendanceCode', { attendanceCode: `ATT-TCH-${String(index + 1).padStart(3, '0')}`, teacherEmployeeNo, teacherName, subject, attendanceDate: new Date('2026-09-13'), status: 'PRESENT', checkInTime: '07:40', checkOutTime: '14:00', remarks: null });
  }

  for (const [index, [staffCode, staffName, , , , , department, , designation, , salary]] of staff.entries()) {
    await insertOnce('payrolls', 'payrollCode', { payrollCode: `PAY-2026-09-${String(index + 1).padStart(3, '0')}`, staffCode, staffName, department, designation, salaryMonth: '2026-09', basicSalary: salary, allowance: 500, deduction: 0, netSalary: salary + 500, status: 'PAID', paymentDate: new Date('2026-09-01'), remarks: 'September payroll' });
  }

  const feeGroups = [
    ['FGR-1A-TUI', 'Grade 1A Tuition', 'Grade 1', 'A', 'TUITION', 1800],
    ['FGR-1B-TUI', 'Grade 1B Tuition', 'Grade 1', 'B', 'TUITION', 1800],
    ['FGR-2A-TUI', 'Grade 2A Tuition', 'Grade 2', 'A', 'TUITION', 2000],
    ['FGR-2B-TUI', 'Grade 2B Tuition', 'Grade 2', 'B', 'TUITION', 2000],
  ];

  for (const [feeGroupCode, feeGroupName, className, section, feeType, amount] of feeGroups) {
    await insertOnce('fee_groups', 'feeGroupCode', { feeGroupCode, feeGroupName, className, section, feeType, amount, dueDays: 10, description: 'Monthly school tuition', status: 'ACTIVE' });
  }

  for (const [index, [admissionNo, firstName, lastName, , , , className, section]] of students.entries()) {
    const group = feeGroups.find((entry) => entry[2] === className && entry[3] === section);
    const amount = group[5];
    const paidAmount = index % 2 === 0 ? amount : amount / 2;
    await insertOnce('fees', 'receiptNo', { receiptNo: `REC-2026-09-${String(index + 1).padStart(3, '0')}`, feeGroupCode: group[0], feeGroupName: group[1], studentAdmissionNo: admissionNo, studentName: `${firstName} ${lastName}`, className, section, feeType: 'TUITION', amount, paidAmount, balance: amount - paidAmount, dueDate: new Date('2026-09-10'), paidDate: paidAmount ? new Date('2026-09-05') : null, paymentStatus: paidAmount === amount ? 'PAID' : 'PARTIAL', paymentMethod: paidAmount ? 'CARD' : null, notes: 'September tuition' });
  }

  for (const [memberCode, memberType, referenceCode, memberName, className, department, phone, email] of [
    ['LIB-STU-001', 'STUDENT', 'STU-2026-001', 'Aisha Al Mansoori', 'Grade 1', null, '0501000001', 'aisha.al.mansoori@example.test'],
    ['LIB-TCH-001', 'TEACHER', 'TCH-001', 'Ms. Leila Hassan', null, 'Academic Affairs', '0504000001', 'leila.hassan@example.test'],
    ['LIB-STF-001', 'STAFF', 'STF-003', 'Nadia Karim', null, 'Academic Affairs', '0505000003', 'nadia.staff@example.test'],
  ]) {
    await insertOnce('library_members', 'memberCode', { memberCode, memberType, referenceCode, memberName, className, department, phone, email, joinDate: new Date('2026-09-01'), status: 'ACTIVE', notes: 'Mock library member' });
  }

  for (const [bookCode, bookTitle, isbn, author, category] of [
    ['BK-001', 'The Little Explorer', '9780000000001', 'Nora Ali', 'Children'],
    ['BK-002', 'Numbers Around Us', '9780000000002', 'Samir Nasser', 'Mathematics'],
    ['BK-003', 'Science for Young Minds', '9780000000003', 'Rania Adel', 'Science'],
    ['BK-004', 'Arabic Stories', '9780000000004', 'Huda Karim', 'Language'],
  ]) {
    await insertOnce('library_books', 'bookCode', { bookCode, bookTitle, isbn, author, category, publisher: 'PreSkool Press', totalCopies: 5, availableCopies: 4, shelfNo: 'A-01', status: 'AVAILABLE', description: 'Mock library book' });
  }

  for (const [routeCode, routeName, startLocation, endLocation, vehicleNo, driverName] of [
    ['RTE-001', 'Jumeirah Route', 'Jumeirah 1', 'PreSkool Campus', 'DXB-12345', 'Ahmed Noor'],
    ['RTE-002', 'Mirdif Route', 'Mirdif', 'PreSkool Campus', 'DXB-67890', 'Bilal Khan'],
  ]) {
    await insertOnce('transport_routes', 'routeCode', { routeCode, routeName, startLocation, endLocation, stops: ['Stop A', 'Stop B', 'Campus'], routePoints: [{ lat: 25.2, lng: 55.3 }], distanceKm: 12.5, estimatedTime: '35 minutes', vehicleNo, driverName, status: 'ACTIVE', notes: 'Mock transport route' });
  }

  for (const [hostelCode, hostelName, hostelType, wardenName] of [
    ['HST-BOYS', 'Boys Residence', 'BOYS', 'Omar Nasser'],
    ['HST-GIRLS', 'Girls Residence', 'GIRLS', 'Salma Adel'],
  ]) {
    await insertOnce('hostels', 'hostelCode', { hostelCode, hostelName, hostelType, wardenName, phone: '042000000', address: 'Campus Residence', totalRooms: 20, totalBeds: 40, availableBeds: 28, monthlyFee: 1200, status: 'ACTIVE', notes: 'Mock hostel' });
  }

  for (const [sportCode, sportName, category, coachName] of [
    ['SPT-FOOT', 'Football', 'Team Sport', 'Mr. Samir Nasser'],
    ['SPT-SWIM', 'Swimming', 'Individual Sport', 'Ms. Rania Adel'],
  ]) {
    await insertOnce('sports', 'sportCode', { sportCode, sportName, category, coachName, venue: 'Sports Hall', practiceDays: 'Tuesday, Thursday', practiceTime: '15:00 - 16:00', maxParticipants: 25, currentParticipants: 12, status: 'ACTIVE', notes: 'Mock activity' });
  }

  const classes = [
    ['Grade 1', 'A', 'Ms. Leila Hassan', 'R-101'],
    ['Grade 1', 'B', 'Mr. Samir Nasser', 'R-102'],
    ['Grade 2', 'A', 'Ms. Rania Adel', 'R-201'],
    ['Grade 2', 'B', 'Ms. Leila Hassan', 'R-202'],
  ];

  for (const [className, section, classTeacher, roomNo] of classes) {
    await insertOnce('classes', ['className', 'section'], { className, section, classTeacher, roomNo, capacity: 28, status: 'ACTIVE' });
  }

  for (const [roomNo, roomName, floor] of [
    ['R-101', 'Grade 1A', 'Ground'], ['R-102', 'Grade 1B', 'Ground'], ['R-201', 'Grade 2A', 'First'], ['R-202', 'Grade 2B', 'First'],
  ]) {
    await insertOnce('class_rooms', 'roomNo', { roomNo, roomName, building: 'Main Building', floor, capacity: 28, status: 'ACTIVE' });
  }

  const subjects = [
    ['SUB-ENG-1', 'English', 'Grade 1', 'Ms. Leila Hassan', 5],
    ['SUB-MAT-1', 'Mathematics', 'Grade 1', 'Mr. Samir Nasser', 5],
    ['SUB-SCI-1', 'Science', 'Grade 1', 'Ms. Rania Adel', 3],
    ['SUB-ENG-2', 'English', 'Grade 2', 'Ms. Leila Hassan', 5],
    ['SUB-MAT-2', 'Mathematics', 'Grade 2', 'Mr. Samir Nasser', 5],
  ];

  for (const [subjectCode, subjectName, className, teacherName, weeklyHours] of subjects) {
    await insertOnce('subjects', 'subjectCode', { subjectCode, subjectName, className, teacherName, weeklyHours, status: 'ACTIVE' });
  }

  const schedule = [
    ['Grade 1', 'A', 'English', 'Ms. Leila Hassan', 'R-101', 'MONDAY', '08:00', '09:00'],
    ['Grade 1', 'A', 'Mathematics', 'Mr. Samir Nasser', 'R-101', 'MONDAY', '09:15', '10:15'],
    ['Grade 1', 'B', 'Science', 'Ms. Rania Adel', 'R-102', 'TUESDAY', '08:00', '09:00'],
    ['Grade 2', 'A', 'English', 'Ms. Leila Hassan', 'R-201', 'TUESDAY', '09:15', '10:15'],
    ['Grade 2', 'A', 'Mathematics', 'Mr. Samir Nasser', 'R-201', 'WEDNESDAY', '08:00', '09:00'],
    ['Grade 2', 'B', 'English', 'Ms. Leila Hassan', 'R-202', 'THURSDAY', '08:00', '09:00'],
  ];

  for (const [index, [className, section, subjectName, teacherName, roomNo, day, startTime, endTime]] of schedule.entries()) {
    const code = `SCH-${String(index + 1).padStart(3, '0')}`;
    await insertOnce('class_routines', 'routineCode', { routineCode: code, className, section, subjectName, teacherName, roomNo, day, startTime, endTime, status: 'ACTIVE' });
    await insertOnce('time_tables', 'timeTableCode', { timeTableCode: `TT-${String(index + 1).padStart(3, '0')}`, className, section, subjectName, teacherName, roomNo, day, startTime, endTime, status: 'ACTIVE' });
  }

  const exams = [
    ['EXM-TERM1-ENG', 'Term 1 English', 'Grade 1', 'A', 'English', 'Ms. Leila Hassan', 'R-101', '2026-10-15'],
    ['EXM-TERM1-MAT', 'Term 1 Mathematics', 'Grade 1', 'A', 'Mathematics', 'Mr. Samir Nasser', 'R-101', '2026-10-17'],
  ];

  for (const [examCode, examName, className, section, subjectName, teacherName, roomNo, examDate] of exams) {
    await insertOnce('exams', 'examCode', { examCode, examName, className, section, subjectName, teacherName, roomNo, examDate: new Date(examDate), startTime: '09:00', endTime: '10:30', maxMarks: 100, minMarks: 40, status: 'SCHEDULED' });
  }

  for (const [index, student] of students.slice(0, 3).entries()) {
    const [admissionNo, firstName, lastName] = student;
    await insertOnce('grades', 'gradeCode', { gradeCode: `GRD-ENG-${String(index + 1).padStart(3, '0')}`, examCode: 'EXM-TERM1-ENG', examName: 'Term 1 English', className: 'Grade 1', section: 'A', subjectName: 'English', teacherName: 'Ms. Leila Hassan', admissionNo, studentName: `${firstName} ${lastName}`, marksObtained: 88 - index * 7, maxMarks: 100, minMarks: 40, result: 'PASS', gradeLetter: index === 0 ? 'A' : 'B', status: 'PUBLISHED' });
  }

  for (const [groupCode, groupName, className, section, classTeacher, subjectNames, subjectCodes] of [
    ['SYL-1A', 'Grade 1A Core Subjects', 'Grade 1', 'A', 'Ms. Leila Hassan', ['English', 'Mathematics', 'Science'], ['SUB-ENG-1', 'SUB-MAT-1', 'SUB-SCI-1']],
    ['SYL-1B', 'Grade 1B Core Subjects', 'Grade 1', 'B', 'Mr. Samir Nasser', ['English', 'Mathematics', 'Science'], ['SUB-ENG-1', 'SUB-MAT-1', 'SUB-SCI-1']],
    ['SYL-2A', 'Grade 2A Core Subjects', 'Grade 2', 'A', 'Ms. Rania Adel', ['English', 'Mathematics'], ['SUB-ENG-2', 'SUB-MAT-2']],
  ]) {
    await insertOnce('syllabus_subject_groups', 'groupCode', { groupCode, groupName, className, section, classTeacher, subjectNames, subjectCodes, totalSubjects: subjectNames.length, status: 'ACTIVE' });
  }

  for (const [title, eventType, audience, startDate, endDate, location, organizer] of [
    ['Parent Orientation', 'MEETING', 'PARENTS', '2026-09-20', '2026-09-20', 'Auditorium', 'Administration'],
    ['Science Fair', 'GENERAL', 'ALL', '2026-10-05', '2026-10-05', 'Sports Hall', 'Academic Affairs'],
    ['Inter-class Football', 'SPORTS_EVENT', 'STUDENTS', '2026-10-12', '2026-10-12', 'Football Ground', 'Mr. Samir Nasser'],
  ]) {
    await insertOnce('school_events', 'title', { title, eventType, audience, startDate: new Date(startDate), endDate: new Date(endDate), startTime: '09:00', endTime: '11:00', location, organizer, description: `Mock event: ${title}`, status: 'ACTIVE' });
  }

  await client.end();
  console.log(JSON.stringify({ message: 'Mock data seed completed', inserted: seeded }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
