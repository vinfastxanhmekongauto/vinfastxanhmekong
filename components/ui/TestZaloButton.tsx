"use client";
import React, { useState } from 'react';

export default function TestZaloButton() {
  const [status, setStatus] = useState("Gửi Test Zalo");

  const handleTest = async () => {
    setStatus("Đang gửi...");
    try {
      const res = await fetch('/api/zalo-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Khách hàng Test",
          phone: "0999999999",
          serviceType: "Lái thử xe VF 3"
        })
      });
      
      // Chờ máy chủ đọc dữ liệu trả về (bao gồm cả khi thành công hoặc có lỗi)
      const data = await res.json();
      
      if (res.ok) {
        setStatus("Gửi thành công! (Check Zalo)");
      } else {
        // Trích xuất chính xác thông báo lỗi từ Zalo (ví dụ: lỗi -224) để in ra nút bấm
        setStatus(`Thất bại: ${data.message || 'Lỗi không xác định'}`);
        console.error("Chi tiết lỗi từ Server:", data);
      }
    } catch (error) {
      console.error(error);
      setStatus("Lỗi mất kết nối mạng");
    }
  };

  return (
    <button 
      onClick={handleTest} 
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium max-w-full truncate"
    >
      {status}
    </button>
  );
}
