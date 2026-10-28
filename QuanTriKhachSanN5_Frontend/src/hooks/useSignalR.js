import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { notification } from 'antd';

// Nhớ tạo store này để lấy Token nhé!
import { useAdminAuthStore } from '../store/adminAuthStore'; 

export const useSignalR = (onNewNotification) => {
    const connectionRef = useRef(null);
    // Lấy token từ Zustand store để nhét vào kết nối
    const token = useAdminAuthStore((state) => state.token);

    useEffect(() => {
        // Khởi tạo kết nối đến Server
        const connection = new signalR.HubConnectionBuilder()
            // Lấy URL Server từ biến môi trường (Ví dụ: https://localhost:7020)
            .withUrl(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/notificationHub`, {
                accessTokenFactory: () => token // Gửi kèm "thẻ thông hành"
            })
            .withAutomaticReconnect() // Tự động kết nối lại nếu rớt mạng
            .build();

        // Lắng nghe sự kiện "ReceiveNotification" từ Server gửi xuống
        connection.on("ReceiveNotification", (data) => {
            if (onNewNotification) {
                onNewNotification(data); // Báo ra ngoài để cập nhật số đếm chuông
            }
            
            // Hiển thị cái bảng thông báo Toast (Pop-up góc phải)
            notification[data.type?.toLowerCase() || 'info']({
                message: data.title,
                description: data.content,
                placement: 'topRight',
            });
        });

        // Bắt đầu chạy kết nối
        connection.start().catch(console.error);
        connectionRef.current = connection;

        // Cleanup: Khi tắt trang thì ngắt kết nối để đỡ nặng máy
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [token]); // Chạy lại Hook này nếu Token thay đổi
};