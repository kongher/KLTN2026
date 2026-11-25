import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Không có quyền truy cập</h1>
      <p className="text-stone-600">Tài khoản của bạn không được phép vào trang này.</p>
      <Link to="/" className="text-rose-700 hover:underline">
        Quay lại trang chính
      </Link>
    </div>
  );
}
