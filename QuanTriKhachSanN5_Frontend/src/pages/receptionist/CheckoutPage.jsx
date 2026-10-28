import React, { useState } from "react";
import { Card, InputNumber, Button, Typography, Divider, QRCode } from "antd";
import invoiceAPI from "../../api/invoiceAPI";
import { auditLogger } from "../../utils/auditLogger";

const { Title, Text } = Typography;



const CheckoutPage = () => {
    const [bookingId, setBookingId] = useState(1);
    const [preview, setPreview] = useState(null);
    const [momoData, setMomoData] = useState(null);
    const [loading, setLoading] = useState(false);

    // 🔍 Xem trước hóa đơn
    const handlePreview = async () => {
        try {
            setLoading(true);
            setMomoData(null);
            const res = await invoiceAPI.preview(bookingId);
            setPreview(res.data);

            try {
                const momoRes = await invoiceAPI.createMomoPayment(bookingId);
                setMomoData(momoRes.data);
            } catch (err) {
                console.error("Không tạo được link MoMo:", err);
            }
        } catch (err) {
            auditLogger.error("Không xem được hóa đơn!", { module: "Thanh Toán", objectName: `Booking #${bookingId}` });
        } finally {
            setLoading(false);
        }
    };

    // 🧾 Checkout thật
    const handleCheckout = async () => {
        try {
            setLoading(true);
            await invoiceAPI.checkout(bookingId);

            auditLogger.success("Checkout thành công!", { 
                actionType: "CHECKOUT", 
                module: "Thanh Toán", 
                objectName: `Booking #${bookingId}`,
                description: `Checkout thành công cho đơn đặt phòng ID: ${bookingId}`
            });
            setPreview(null);
        } catch (err) {
            auditLogger.error(err.response?.data?.message || "Lỗi checkout!", { module: "Thanh Toán", objectName: `Booking #${bookingId}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ maxWidth: 700, margin: "auto" }}>
            <Title level={3}>Trả phòng & Hóa đơn</Title>

            <div style={{ marginBottom: 10 }}>
                Booking ID:
                <InputNumber
                    style={{ width: "100%" }}
                    value={bookingId}
                    onChange={setBookingId}
                />
            </div>

            <Button type="primary" onClick={handlePreview} loading={loading} block>
                Xem trước hóa đơn
            </Button>

            {preview && (
                <>
                    <Divider />

                    <Text strong>Khách: {preview.guestName}</Text>
                    <br />
                    <Text>Mã đơn: {preview.bookingCode}</Text>

                    <Divider />

                    <Text>Tiền phòng: {preview.totalRoomAmount.toLocaleString()} đ</Text>
                    <br />
                    <Text>Dịch vụ + Đền bù: {preview.totalServiceAmount.toLocaleString()} đ</Text>
                    <br />
                    <Text>Thuế: {preview.taxAmount.toLocaleString()} đ</Text>

                    <Divider />

                    <Title level={4}>
                        Tổng: {preview.finalTotal.toLocaleString()} đ
                    </Title>

                    <div style={{ textAlign: "center", margin: "20px 0" }}>
                        <Title level={5}>Thanh toán qua MoMo</Title>
                        {momoData ? (
                            <>
                                <img src={momoData.qrCodeUrl} alt="MoMo QR Code" width={200} style={{ margin: "auto", display: "block", borderRadius: 8, border: "1px solid #ddd" }} />
                                <div style={{ marginTop: 16 }}>
                                    <Button type="primary" href={momoData.payUrl} target="_blank">
                                        Mở trang thanh toán
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Text type="secondary">Đang tải mã thanh toán MoMo...</Text>
                        )}
                    </div>

                    <Text type="secondary">{preview.note}</Text>

                    <Divider />

                    <Button
                        type="primary"
                        danger
                        onClick={handleCheckout}
                        loading={loading}
                        block
                    >
                        Xác nhận Checkout & Xuất hóa đơn
                    </Button>
                </>
            )}
        </Card>
    );
};

export default CheckoutPage;