# HƯỚNG DẪN CHI TIẾT CÁCH LÀM BÀI KIỂM TRA CUỐI KỲ
## MÔN HỌC: KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM (SOFTWARE TESTING)

---

> [!IMPORTANT]
> **Dành cho Sinh viên**: Tài liệu này hướng dẫn chi tiết quy trình, cấu trúc hồ sơ, chuẩn đầu ra học phần (CLO), tiêu chuẩn trình bày báo cáo kỹ thuật và checklist chấm điểm (Performance Test - 100 điểm) đối với Bài tập lớn / Báo cáo kiểm tra cuối kỳ môn Kiểm thử phần mềm. Sinh viên cần đọc kỹ và tuân thủ đầy đủ để đạt kết quả tối ưu.

---

## 1. TỔNG QUAN VỀ BÀI KIỂM TRA CUỐI KỲ

Báo cáo phải thể hiện được 6 nội dung cốt lõi:
1. **Việc hiểu và phân tích yêu cầu phần mềm**: Xác định đúng các chức năng chính, lập bản đồ chức năng (function map).
2. **Thiết kế và viết test case**: Áp dụng đúng các kỹ thuật kiểm thử hộp đen (Phân vùng tương đương, Phân tích giá trị biên, Bảng quyết định, Use Case...).
3. **Triển khai kiểm thử thực tế**: Thực hiện kiểm thử thủ công (manual) hoặc tự động/công cụ (tool-based) và ghi lại kết quả test thực tế.
4. **Quản lý lỗi (nếu có)**: Ghi nhận lỗi đúng quy chuẩn, sử dụng công cụ quản lý lỗi (Jira, Trello, Redmine...).
5. **Đo lường kết quả kiểm thử và đưa ra đánh giá**: Tính toán chỉ số (% test passed, defect density, test coverage) và bình luận chất lượng sản phẩm.
6. **Viết báo cáo theo định dạng kỹ thuật**: Bố cục rõ ràng, có tiêu đề, mã hiệu, phân tích logic, mục lục tự động.

### 1.2. Chuẩn đầu ra học phần (CLOs)
Bài báo cáo cuối kỳ đánh giá mức độ đạt 4 Chuẩn đầu ra học phần:

| STT | Mã CLO | Mô Tả Chuẩn Đầu Ra Học Phần |
| :---: | :---: | :--- |
| 1 | **CLO1** | Viết báo cáo trình bày nội dung các công việc đã thực hiện bằng văn bản một cách hợp lý và đúng quy định về định dạng. |
| 2 | **CLO2** | Thực hiện các bài kiểm thử để kiểm tra các yêu cầu chức năng phù hợp với các mục tiêu dự án. |
| 3 | **CLO3** | Đo lường các kết quả thu được trong quá trình kiểm thử để đánh giá các chức năng đã xây dựng. |
| 4 | **CLO4** | Sử dụng kỹ năng trong việc sắp xếp công việc cá nhân hoặc nhóm phù hợp với mục tiêu công việc đề ra. |

---

## 2. DANH MỤC HỒ SƠ BẮT BUỘC PHẢI NỘP

Mỗi nhóm sinh viên phải hoàn thành và nộp đầy đủ **04 bộ hồ sơ thành phần** trong thư mục nộp bài (đóng gói dạng `.zip` theo cấu trúc tên: `[MãLớp]_[TênNhóm]_[TênĐềTài].zip`):

```
📁 [MãLớp]_[TênNhóm]_[TênĐềTài]/
├── 📄 1_BaoCao_TongHop.docx   # Báo cáo kỹ thuật chính toàn văn (8 Phần)
├── 📊 2_TR_and_TC_ChiTiet.xlsx             # Danh sách TR & Test Cases chi tiết
├── 📅 3_Timeline_TienDo_WBS.xlsx          # Biểu đồ Gantt & Phân công công việc (WBS)
└── 📊 4_Slide_ThuyetTrinh.pptx            # Slide báo cáo bảo vệ nhóm (PowerPoint)
```

---

## 3. HƯỚNG DẪN CẤU TRÚC BÁO CÁO KỸ THUẬT (TECHNICAL REPORT)

File Báo cáo chính (`1_BaoCao_TongHop.docx` / `.pdf`) phải tuân thủ **Cấu trúc Báo cáo Kỹ thuật 8 Phần** theo đúng quy định:

### 📌 Trang bìa & Thông tin chung
* Tên trường: **TRƯỜNG ĐẠI HỌC LẠC HỒNG - KHOA CÔNG NGHỆ THÔNG TIN**
* Tên báo cáo: **BÁO CÁO KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM**
* Đề tài: Kiểm thử ứng dụng [Tên ứng dụng Web/Mobile/Desktop]
* Thông tin: Giảng viên hướng dẫn, Lớp, Danh sách sinh viên (Họ tên + MSSV), Ngày nộp.
* **Mục lục tự động**, Danh mục bảng biểu, Danh mục hình ảnh.

---

### 📌 NỘI DUNG 8 PHẦN CỦA BÁO CÁO KIỂM THỬ:

#### 1. GIỚI THIỆU
* **1.1. Mục tiêu kiểm thử**: Xác định rõ mục đích kiểm thử (đảm bảo chất lượng chức năng, phát hiện lỗi, đo lường độ ổn định...).
* **1.2. Giới thiệu ứng dụng được kiểm thử**: Tổng quan về phần mềm (tên ứng dụng, phiên bản, nền tảng Web/Mobile/Desktop, công nghệ xây dựng, đối tượng người dùng).

#### 2. PHÂN TÍCH YÊU CẦU
* **2.1. Liệt kê các chức năng chính**: Phân tích chi tiết danh sách các module/chức năng chính của hệ thống cần kiểm thử (In-Scope và Out-of-Scope).
* **2.2. Bản đồ chức năng (Function Map)**: Trình bày sơ đồ phân rã chức năng (Mindmap / Function Tree / Diagram) thể hiện cấu trúc tổng quan các tính năng của phần mềm.

#### 3. THIẾT KẾ KIỂM THỬ
* **3.1. Phương pháp & Kỹ thuật thiết kế Test Case**: Mô tả phương pháp kiểm thử (Manual / Black-box testing) và các kỹ thuật áp dụng (Phân vùng tương đương EP, Phân tích giá trị biên BVA, Bảng quyết định Decision Table, Kịch bản Use Case...).
* **3.2. Danh sách Yêu cầu kiểm thử (Test Requirements - TR)**: Bảng trích xuất mã yêu cầu kiểm thử (`TR ID`, Module, Mô tả yêu cầu, TR Type).
* **3.3. Danh sách Test Case mẫu (Bảng Test Case chi tiết)**: Trình bày bảng kịch bản kiểm thử gồm đầy đủ các trường thông tin tiêu chuẩn:
  * `TC ID`: Mã định danh kịch bản (VD: `TC-UA-01`, `TC-PM-02`).
  * `Mô tả (Description)`: Mục đích bài test.
  * `Điều kiện tiên quyết (Pre-conditions)`: Trạng thái trước khi thực hiện test.
  * `Các bước thực hiện (Test Steps)`: Chi tiết từng bước 1, 2, 3 thao tác.
  * `Dữ liệu đầu vào (Input / Test Data)`: Dữ liệu sử dụng để test.
  * `Kết quả mong đợi (Expected Result)`: Phản ứng chuẩn của hệ thống.
  * `Kết quả thực tế (Actual Result)`: Kết quả thu được thực tế.
  * `Trạng thái (Status)`: **Pass** hoặc **Fail**.

#### 4. THỰC HIỆN KIỂM THỬ
* **4.1. Kết quả thực tế**: Quá trình triển khai kiểm thử thực tế (thực hiện Manual testing hoặc chạy Tool-based testing như Selenium, Postman, JMeter...).
* **4.2. Hình ảnh minh họa bằng chứng kiểm thử**: Đính kèm ảnh chụp màn hình (Screenshots evidence) ghi nhận quá trình thao tác thực tế trên giao diện ứng dụng.

#### 5. QUẢN LÝ LỖI (BUG MANAGEMENT)
* **5.1. Sử dụng phần mềm quản lý lỗi**: Giới thiệu công cụ quản lý lỗi nhóm áp dụng (Jira, Trello, Redmine, GitHub Issues, hoặc file quản lý chuyên nghiệp).
* **5.2. Bảng tổng hợp lỗi (Defect Log / Bug Report)**: Liệt kê danh sách lỗi phát hiện với các cột thông tin:
  * `Bug ID`, `Module`, `Mô tả lỗi thực tế`, `Mức độ nghiêm trọng (Severity: Fatal/Critical/Major/Minor)`, `Mức độ ưu tiên (Priority: High/Medium/Low)`, `TC ID liên quan`, `Trạng thái (Status: New/Open/Fixed/Re-tested)`.
* **5.3. Mô tả & Phân tích lỗi**: Trình bày chi tiết các lỗi tiêu biểu kèm ảnh chụp màn hình bằng chứng, phân tích nguyên nhân gốc (Root Cause) và hướng xử lý.

#### 6. ĐÁNH GIÁ KẾT QUẢ & ĐO LƯỜNG
* **6.1. Các chỉ số đo lường (Test Metrics)**:
  * Tỷ lệ Đạt/Thất bại: `% Pass Rate = (Số TC Pass / Tổng số TC) * 100%`.
  * Mật độ lỗi (Defect Density).
  * Mức độ bao phủ yêu cầu (Test Coverage % = `TR Coverage`).
* **6.2. Phân tích hiệu quả & Bình luận chất lượng**: Bình luận, đánh giá chất lượng sản phẩm dựa trên kết quả đo lường thực tế.
* **6.3. Quyết định triển khai (Go / No-Go Decision)**: Đưa ra quyết định phát hành chính thức (Go) hay hoãn triển khai (No-Go) dựa trên số lượng bug Critical còn tồn đọng.

#### 7. TỔ CHỨC THỰC HIỆN
* **7.1. Phân công công việc (WBS) & Lịch trình (Timeline / Gantt Chart)**: Bảng phân công chi tiết công việc cho từng thành viên, thời gian bắt đầu, kết thúc, % hoàn thành và biểu đồ Gantt.
* **7.2. Công cụ hỗ trợ & Nhật ký kiểm thử**: Liệt kê các công cụ hỗ trợ (Excel, Jira, Word, Canva...) và Nhật ký hoạt động kiểm thử (Test Log / Activity Log).

#### 8. KẾT LUẬN
* **8.1. Nhận xét tổng thể**: Tổng kết về dự án kiểm thử, các kết quả đạt được.
* **8.2. Hướng cải tiến**: Đề xuất giải pháp nâng cao chất lượng phần mềm và các bước tiếp theo nếu tiếp tục đợt kiểm thử mới.

---

## 4. CHECKLIST CHẤM ĐIỂM (PERFORMANCE TEST - 100 ĐIỂM)

Bảng tiêu chí đánh giá và chấm điểm chi tiết theo Chuẩn đầu ra môn học (CLO):

| Mục đánh giá | Tiêu chí | CLO liên quan | Điểm tối đa |
| :--- | :--- | :---: | :---: |
| **1. Phân tích yêu cầu & mục tiêu kiểm thử** | Xác định đúng các yêu cầu chức năng chính của phần mềm được chọn | CLO2 | 10 |
| | Mô tả rõ ràng mục tiêu kiểm thử | CLO2 | 5 |
| **2. Thiết kế kiểm thử** | Thiết kế test case rõ ràng, có đầy đủ ID, mô tả, input, expected output, trạng thái... | CLO2 | 10 |
| | Áp dụng đúng kỹ thuật thiết kế test case (Boundary Value, Equivalence Class...) | CLO2 | 5 |
| **3. Triển khai kiểm thử & ghi nhận kết quả** | Thực hiện đầy đủ test case và ghi lại kết quả test | CLO2 | 10 |
| | Phân tích và đánh giá kết quả test (pass/fail, root cause...) | CLO3 | 10 |
| **4. Quản lý lỗi (Bug Management)** | Ghi nhận lỗi đúng cách, có mô tả, ảnh chụp màn hình, mức độ nghiêm trọng, trạng thái... | CLO3 | 10 |
| | Sử dụng phần mềm quản lý lỗi (nếu có): Jira, Trello, Redmine,... | CLO3 | 5 |
| **5. Đo lường và đánh giá hiệu quả** | Đưa ra các chỉ số đo lường cơ bản: % test passed, defect density, test coverage... | CLO3 | 5 |
| | Bình luận, đánh giá về chất lượng phần mềm dựa trên kết quả test | CLO3 | 5 |
| **6. Báo cáo trình bày & định dạng** | Bố cục báo cáo rõ ràng, có đầy đủ mục lục, các phần hợp lý | CLO1 | 5 |
| | Viết báo cáo theo định dạng kỹ thuật: có tiêu đề, mã hiệu, phân tích logic | CLO1 | 5 |
| **7. Quản lý và tổ chức công việc** | Có sơ đồ kế hoạch kiểm thử (timeline, phân công) | CLO4 | 5 |
| | Cho thấy có sự phối hợp nhóm hoặc cá nhân chủ động quản lý tiến độ | CLO4 | 5 |
| **TỔNG ĐIỂM** | | | **100** |

---

## 5. CÁC LỖI THƯỜNG GẶP CẦN TRÁNH

> [!CAUTION]
> Sinh viên lưu ý tránh các lỗi phổ biến sau đây để không bị trừ điểm:

1. **Sai lệch cấu trúc báo cáo**: Không tuân thủ cấu trúc 8 phần kỹ thuật theo gợi ý.
2. **Test Case quá sơ sài**: Chỉ ghi tên test case chung chung mà thiếu các bước thực hiện (`Test Steps`), dữ liệu đầu vào (`Input`), và điều kiện tiên quyết (`Pre-conditions`).
3. **Mô tả Actual Result không chính xác**: Ghi trạng thái Fail nhưng lại sao chép nguyên văn nội dung Expected Result.
4. **Bug Log thiếu thông tin bằng chứng**: Thiếu ảnh chụp màn hình minh họa lỗi, không phân cấp mức độ nghiêm trọng (`Severity`) và ưu tiên (`Priority`).
5. **Số liệu không đồng nhất**: Các con số thống kê (% Pass Rate, số lượng TC, số lượng Bug) trong file Báo cáo Word không khớp với file Excel và Slide PowerPoint.
6. **Bỏ trống sơ đồ phân công**: Thiếu biểu đồ Gantt / WBS thể hiện sự chủ động quản lý tiến độ và phối hợp làm việc nhóm.