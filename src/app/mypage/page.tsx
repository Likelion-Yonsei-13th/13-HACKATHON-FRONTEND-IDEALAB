import MyPage from "@/components/MyPage";
import Sidebar from "@/components/Sidebar";

export default function MyPageRoute() {
  return (
    <div className="flex">
      <Sidebar />
      <MyPage />
    </div>
  );
}
