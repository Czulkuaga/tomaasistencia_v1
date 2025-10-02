// src/app/register/encuesta/[id]/page.tsx
import AnswerSurvey from "@/components/encuesta/AnswerSurvey";

export default async function AnswerSurveyPage({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <AnswerSurvey surveyId={id} />;
}
