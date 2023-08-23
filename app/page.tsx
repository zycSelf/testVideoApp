import dynamic from "next/dynamic";
const ClientComponents = dynamic(() => import("@/app/components/videoView"))
export default async function Home() {
  return (
    <ClientComponents />
  )
}
