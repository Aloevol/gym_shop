import type { Metadata } from "next";
import { getAllAboutSectionsServerSide, getAllTeamMembersServerSide } from '@/server/functions/about-page.fun';

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn about Thryve — our story, mission, expert team, and commitment to helping you reach your fitness goals.",
    openGraph: {
        title: "About Us",
        description: "Learn about Thryve — our story, mission, expert team, and vision.",
    },
};
import DynamicAboutPage from "@/app/(main)/about/_components/DynamicAboutPage";


export default async function AboutPage() {
    const [sectionsResponse, teamMembersResponse] = await Promise.all([
        getAllAboutSectionsServerSide(),
        getAllTeamMembersServerSide()
    ]);

    const sections = sectionsResponse.isError ? [] : sectionsResponse.data?.sections || [];
    const teamMembers = teamMembersResponse.isError ? [] : teamMembersResponse.data?.teamMembers || [];

    return <DynamicAboutPage
        sections={sections} teamMembers={teamMembers} />;
}