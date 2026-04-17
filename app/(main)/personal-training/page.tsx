import type { Metadata } from "next";
import PersonalTrainingContent from "./_components/PersonalTrainingContent";

export const metadata: Metadata = {
    title: "Personal Training",
    description: "Join Thryve's elite personal training programs. Expert-led workouts, daily live sessions, and custom plans to transform your fitness.",
    openGraph: {
        title: "Personal Training",
        description: "Elite personal training programs with expert-led workouts and daily live sessions.",
        type: "website",
    },
};

export default function PersonalTrainingPage() {
    return <PersonalTrainingContent />;
}
