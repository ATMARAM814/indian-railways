
const db = require("./questionBank.repository");
const { logAction } = require("../audit/audit.service");
const XLSX = require("xlsx");

const ALLOWED_ROLES = ["PM", "SM", "TM", "SS", "TI", "AOM", "COMMON", "SMS", "CABIN MASTER", "SHM"];
const ALLOWED_ANSWERS = ["A", "B", "C", "D"];

function validateQuestionData({
  roleCode,
  questionText,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
}) {
  if (!questionText || !questionText.trim()) {
    throw new Error("questionText is required");
  }
  if (!roleCode || !ALLOWED_ROLES.includes(roleCode.toUpperCase())) {
    throw new Error(`roleCode must be one of: ${ALLOWED_ROLES.join(", ")}`);
  }
  if (
    !optionA || !optionA.trim() ||
    !optionB || !optionB.trim() ||
    !optionC || !optionC.trim() ||
    !optionD || !optionD.trim()
  ) {
    throw new Error("All four options (optionA, optionB, optionC, optionD) are required");
  }
  if (!correctAnswer || !ALLOWED_ANSWERS.includes(correctAnswer.toUpperCase())) {
    throw new Error(`correctAnswer must be one of: ${ALLOWED_ANSWERS.join(", ")}`);
  }
}

async function addQuestionService(userId, data) {
  // Validate request fields
  validateQuestionData(data);

  const roleCodeUpper = data.roleCode.toUpperCase();
  const correctAnswerUpper = data.correctAnswer.toUpperCase();

  // Prevent duplicate text for same role
  const existing = await db.getQuestionByTextAndRole(data.questionText, roleCodeUpper);
  if (existing) {
    throw new Error(`A question with this text already exists for role ${roleCodeUpper}`);
  }

  const question = await db.createQuestion({
    roleCode: roleCodeUpper,
    questionText: data.questionText,
    optionA: data.optionA,
    optionB: data.optionB,
    optionC: data.optionC,
    optionD: data.optionD,
    correctAnswer: correctAnswerUpper,
  });

  // Write audit log
  await logAction(
    userId,
    "QUESTION_CREATED",
    "QUESTION",
    question.id,
    null,
    question,
    `Question added manually for role ${roleCodeUpper}`
  );

  return question;
}

async function listQuestionsService(filters) {
  const total = await db.countQuestions(filters);
  const records = await db.getQuestions(filters);

  const limit = Number(filters.limit || 10);
  const page = Number(filters.page || 1);
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getQuestionByIdService(id) {
  const question = await db.getQuestionById(id);
  if (!question) {
    throw new Error("Question not found");
  }
  return question;
}

async function updateQuestionService(id, userId, data) {
  // Check if exists
  const existing = await db.getQuestionById(id);
  if (!existing) {
    throw new Error("Question not found");
  }

  // Validate request fields
  validateQuestionData(data);

  const roleCodeUpper = data.roleCode.toUpperCase();
  const correctAnswerUpper = data.correctAnswer.toUpperCase();

  // If text or role changed, prevent duplicates
  if (
    existing.questionText !== data.questionText ||
    existing.roleCode !== roleCodeUpper
  ) {
    const dup = await db.getQuestionByTextAndRole(data.questionText, roleCodeUpper);
    if (dup && dup.id !== id) {
      throw new Error(`A question with this text already exists for role ${roleCodeUpper}`);
    }
  }

  const updated = await db.updateQuestion(id, {
    roleCode: roleCodeUpper,
    questionText: data.questionText,
    optionA: data.optionA,
    optionB: data.optionB,
    optionC: data.optionC,
    optionD: data.optionD,
    correctAnswer: correctAnswerUpper,
  });

  // Write audit log
  await logAction(
    userId,
    "QUESTION_UPDATED",
    "QUESTION",
    id,
    existing,
    updated,
    `Question updated by user`
  );

  return updated;
}

async function activateQuestionService(id, userId) {
  const existing = await db.getQuestionById(id);
  if (!existing) {
    throw new Error("Question not found");
  }

  const updated = await db.updateQuestionStatus(id, "active");

  await logAction(
    userId,
    "QUESTION_ACTIVATED",
    "QUESTION",
    id,
    existing,
    updated,
    "Question status set to active"
  );

  return updated;
}

async function deactivateQuestionService(id, userId) {
  const existing = await db.getQuestionById(id);
  if (!existing) {
    throw new Error("Question not found");
  }

  const updated = await db.updateQuestionStatus(id, "inactive");

  await logAction(
    userId,
    "QUESTION_DEACTIVATED",
    "QUESTION",
    id,
    existing,
    updated,
    "Question status set to inactive"
  );

  return updated;
}

async function importQuestionsService(userId, questionsList) {
  if (!Array.isArray(questionsList)) {
    throw new Error("questions array is required");
  }

  let insertedCount = 0;
  const failed = [];
  const validToInsert = [];

  const roles = [...new Set(questionsList.map(q => (q.roleCode || '').toUpperCase()).filter(Boolean))];
  const existingRows = await db.getExistingQuestionsForRoles(roles);
  const existingSet = new Set(existingRows.map(r => `${r.roleCode}:${r.questionText.trim()}`));

  for (let i = 0; i < questionsList.length; i++) {
    const rowNumber = i + 1;
    const row = questionsList[i];

    try {
      // 1. Structural checks
      validateQuestionData(row);

      const roleCodeUpper = row.roleCode.toUpperCase();
      const correctAnswerUpper = row.correctAnswer.toUpperCase();

      // 2. Duplicate checks
      const key = `${roleCodeUpper}:${row.questionText.trim()}`;
      if (existingSet.has(key)) {
        throw new Error(`A question with this text already exists for role ${roleCodeUpper}`);
      }

      existingSet.add(key);

      validToInsert.push({
        roleCode: roleCodeUpper,
        questionText: row.questionText,
        optionA: row.optionA,
        optionB: row.optionB,
        optionC: row.optionC,
        optionD: row.optionD,
        correctAnswer: correctAnswerUpper,
      });
    } catch (err) {
      failed.push({
        row: rowNumber,
        reason: err.message,
      });
    }
  }

  // 3. Bulk insert valid questions
  if (validToInsert.length > 0) {
    await db.createQuestionsBulk(validToInsert);
    insertedCount = validToInsert.length;
  }

  if (insertedCount > 0) {
    await logAction(
      userId,
      "QUESTIONS_IMPORTED",
      "QUESTION",
      null,
      null,
      { imported: insertedCount, failedCount: failed.length },
      `Imported ${insertedCount} questions via bulk import`
    );
  }

  return {
    inserted: insertedCount,
    failed,
  };
}

async function parseQuestionsExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const parsedQuestions = [];
  let startIndex = 0;
  
  // Skip column header row if present
  if (rows.length > 0) {
    const firstCell = String(rows[0][0] || "").toLowerCase().trim();
    if (firstCell.includes("question") || firstCell.includes("प्रश्न") || firstCell.includes("text")) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !String(row[0] || "").trim()) {
      continue;
    }

    const questionText = String(row[0] || "").trim();
    const optionA = String(row[1] || "").trim();
    const optionB = String(row[2] || "").trim();
    const optionC = String(row[3] || "").trim();
    const optionD = String(row[4] || "").trim();
    const correctAnswer = String(row[5] || "").trim().toUpperCase();
    const explanation = row[6] ? String(row[6] || "").trim() : null;

    parsedQuestions.push({
      qNum: parsedQuestions.length + 1,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation
    });
  }

  return parsedQuestions;
}

async function uploadQuestionSetService(userId, userName, roleCode, fileBuffer) {
  if (!roleCode || !ALLOWED_ROLES.includes(roleCode.toUpperCase())) {
    throw new Error(`Invalid role selected. Must be one of: ${ALLOWED_ROLES.join(", ")}`);
  }

  const roleCodeUpper = roleCode.toUpperCase();

  // Parse Excel file rows
  const parsedQuestions = await parseQuestionsExcel(fileBuffer);

  if (parsedQuestions.length === 0) {
    throw new Error("No questions could be parsed from the uploaded Excel file.");
  }

  const errors = [];

  // Validate columns
  const validatedQuestions = parsedQuestions.map((q, idx) => {
    const rowNumber = idx + 2; // Row 1 is header (index 0 is row 2)
    if (!q.questionText) {
      errors.push(`Row ${rowNumber}: Question text is missing`);
    }
    if (!q.optionA) {
      errors.push(`Row ${rowNumber}: Option A is missing`);
    }
    if (!q.optionB) {
      errors.push(`Row ${rowNumber}: Option B is missing`);
    }
    if (!q.optionC) {
      errors.push(`Row ${rowNumber}: Option C is missing`);
    }
    if (!q.optionD) {
      errors.push(`Row ${rowNumber}: Option D is missing`);
    }
    if (!q.correctAnswer) {
      errors.push(`Row ${rowNumber}: Correct answer is missing`);
    } else if (!ALLOWED_ANSWERS.includes(q.correctAnswer)) {
      errors.push(`Row ${rowNumber}: Invalid correct answer '${q.correctAnswer}' (must be A, B, C, or D)`);
    }

    return {
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    };
  });

  if (errors.length > 0) {
    const err = new Error("Validation failed");
    err.validationErrors = errors;
    throw err;
  }

  // Call repo replacement transaction
  const log = {
    uploadedBy: userId,
    uploadedByName: userName,
    remarks: `Uploaded bulk question bank via Excel (${validatedQuestions.length} questions) for role ${roleCodeUpper}`
  };

  const result = await db.replaceQuestionBank({
    roleCode: roleCodeUpper,
    questions: validatedQuestions,
    log
  });

  return {
    success: true,
    roleCode: roleCodeUpper,
    questionCount: result.count,
    uploadedAt: new Date()
  };
}

async function getUploadHistoryService(page, limit) {
  return await db.getUploadHistory({ page, limit });
}

async function getQuestionBankStatsService() {
  return await db.getQuestionBankStats();
}

async function generateExcelTemplateBuffer() {
  const headers = [
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer (A/B/C/D)",
    "Explanation (Optional)"
  ];
  
  const sampleRow1 = [
    "गाडी विखंडन होने पर कांटेवाला रात में किस प्रकार सिगनल दिखायेगा ? / In case of train parting, pointsman shall show which signal by night ?",
    "लाल बत्ती / Red lamp",
    "हरी झंडी ऊपर-नीचे बत्ती / Green flag vertically up and down",
    "सफेद बत्ती ऊपर-नीचे / White lamp vertically up and down",
    "हरी बत्ती ऊपर-नीचे / Green lamp vertically up and down",
    "A",
    "Pointsman shows red flag or red lamp vertically in case of parting."
  ];

  const sampleRow2 = [
    "5 बाक्स वाहनों की शंटिंग की अधिकतम गति कितनी होती है? / Maximum speed of shunting of 5 box wagons is ?",
    "15 km/h",
    "8 km/h",
    "1 km/h",
    "2 km/h",
    "B",
    "Maximum speed of shunting of 5 box wagons is 8 km/h."
  ];

  const data = [headers, sampleRow1, sampleRow2];
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

async function deleteQuestionService(id, userId) {
  const existing = await db.getQuestionById(id);
  if (!existing) {
    throw new Error("Question not found");
  }

  const result = await db.deleteQuestion(id);

  await logAction(
    userId,
    "QUESTION_DELETED",
    "QUESTION",
    id,
    existing,
    null,
    `Question deleted: ${existing.questionText}`
  );

  return result;
}

async function exportQuestionsExcelService(roleCode) {
  let questions;
  if (roleCode) {
    const roleCodeUpper = roleCode.toUpperCase();
    if (!ALLOWED_ROLES.includes(roleCodeUpper)) {
      throw new Error(`Invalid role selected. Must be one of: ${ALLOWED_ROLES.join(", ")}`);
    }
    questions = await db.getAllActiveQuestionsByRole(roleCodeUpper);
  } else {
    questions = await db.getAllActiveQuestions();
  }

  const headers = [
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer (A/B/C/D)",
    "Explanation (Optional)"
  ];

  const data = [headers];
  for (const q of questions) {
    data.push([
      q.questionText || "",
      q.optionA || "",
      q.optionB || "",
      q.optionC || "",
      q.optionD || "",
      q.correctAnswer || "",
      q.explanation || ""
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

module.exports = {
  addQuestionService,
  listQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  activateQuestionService,
  deactivateQuestionService,
  importQuestionsService,
  uploadQuestionSetService,
  getUploadHistoryService,
  getQuestionBankStatsService,
  generateExcelTemplateBuffer,
  deleteQuestionService,
  exportQuestionsExcelService,
};

