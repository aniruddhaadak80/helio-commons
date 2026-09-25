import { MissionDetailClient } from "@/components/mission-detail-client";

type MissionPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: MissionPageProps) {
  const { id } = await params;
  return { title: `Flight plan ${id}` };
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { id } = await params;
  return <main className="site-shell page-frame"><MissionDetailClient missionId={id} /></main>;
}
