export function scoreExam({ form, bankById, answersByQid }) {
  const questionIds = form.question_ids;

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  const perQuestion = {}; // qid -> { selected, correctAnswer, isCorrect, isAnswered }

  questionIds.forEach((qid) => {
    const q = bankById[qid];
    const correctAnswer = q.correct_answer; // "A"|"B"|"C"|"D"
    const selected = answersByQid[qid]; // "A"|"B"|"C"|"D" | undefined

    const isAnswered = selected !== undefined && selected !== "";
    const isCorrect = isAnswered && selected === correctAnswer;

    if (!isAnswered) unanswered += 1;
    else if (isCorrect) correct += 1;
    else incorrect += 1;

    perQuestion[qid] = {
      selected: isAnswered ? selected : "",
      correctAnswer,
      isCorrect,
      isAnswered,
    };
  });

  return {
    total: questionIds.length,
    correct,
    incorrect,
    unanswered,
    perQuestion,
  };
}
