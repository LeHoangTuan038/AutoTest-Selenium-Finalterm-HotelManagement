import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Input, Space, Tag, Spin, Divider, Modal, Avatar } from 'antd';
import { SearchOutlined, CalendarOutlined, UserOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';

const stripMarkdown = (md = "") => {
  if (!md) return "";
  return md
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[.*?\]\(.*?\)/g, "") // remove links
    .replace(/#{1,6}\s+/g, "") // remove headers
    .replace(/[*_`~]/g, "") // remove formatting characters
    .trim();
};

// IMPORT THƯ VIỆN SWIPER CHUYÊN NGHIỆP CHO BANNER TRƯỢT NGANG
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, EffectFade } from 'swiper/modules';

// Import các file CSS cần thiết của Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const COLORS = {
  gold: "#c19b4a",
  dark: "#1a1a1a",
  light: "#ffffff",
  lightGrey: "#f8f9fa",
  gray: "#595959",
  border: "rgba(0, 0, 0, 0.08)",
  cardBg: "#ffffff"
};

// Khai báo tập ảnh fallback chất lượng cao từ Unsplash cho các bài đăng
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop", // Resort/Hotel
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop", // Hotel exterior
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop", // Restaurant
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop", // Spa
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop", // Bedroom Suite
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop", // Beach
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000&auto=format&fit=crop", // Sunset beach
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000&auto=format&fit=crop", // Lobby
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop", // Gym/Fitness
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1000&auto=format&fit=crop", // Luxury Bedroom
];

// Map tên tác giả giả lập dựa trên author_id
const AUTHORS = {
  1: { name: "Nguyễn Minh Trí", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  2: { name: "Trần Thị Ánh Tuyết", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  3: { name: "Phạm Hùng Sơn", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" }
};

const NewsPage = () => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  // State quản lý bài viết và danh mục
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // State xem chi tiết bài viết
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Cuộn trang lên đầu khi mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Gọi API lấy bài viết từ SQL Server (Lấy danh sách Posts và lọc chỉ các bài đã xuất bản)
  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/Posts`);
        const allPosts = response.data || [];
        // Chỉ hiện bài viết đã được Admin xuất bản (isPublished = true)
        const publishedPosts = allPosts.filter(x => x.isPublished);
        setArticles(publishedPosts);

        // Trích xuất danh mục duy nhất từ các bài viết trả về
        const uniqueCategories = [];
        const seenIds = new Set();

        publishedPosts.forEach(article => {
          if (article.category && !seenIds.has(article.category.id)) {
            seenIds.add(article.category.id);
            uniqueCategories.push(article.category);
          }
        });
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bài đăng tin tức:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, []);

  // Hàm hỗ trợ lấy ảnh bài viết (Ưu tiên ảnh từ CSDL, fallback sang ảnh Unsplash đẹp mắt)
  const getArticleImage = (article, index) => {
    if (article.thumbnailUrl && article.thumbnailUrl !== "NULL") {
      return article.thumbnailUrl;
    }
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  };

  // Định dạng ngày giờ chuẩn tiếng Việt
  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Bộ lọc tìm kiếm & Danh mục
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryId === "all" || 
      article.categoryId === parseInt(selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  // Tách riêng 4 bài viết mới nhất để hiển thị lướt ngang ở banner Hot
  const hotArticles = articles.slice(0, 4);

  // Danh sách các bài viết còn lại bên dưới lưới tin tức (loại trừ các bài đang nằm ở Banner trượt)
  const regularArticles = filteredArticles.filter(art => !hotArticles.some(hot => hot.id === art.id));

  const handleOpenDetail = (article) => {
    setSelectedArticle(article);
    setDetailModalOpen(true);
  };

  // Animation variants
  const listVariant = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // Inject CSS tùy chỉnh cho các nút mũi tên và dấu chấm chỉ số của Swiper
  const customSwiperStyles = `
    .news-hot-swiper .swiper-button-next,
    .news-hot-swiper .swiper-button-prev {
      color: ${COLORS.gold} !important;
      background: rgba(255, 255, 255, 0.8) !important;
      width: 46px !important;
      height: 46px !important;
      border-radius: 50% !important;
      border: 1px solid rgba(193, 155, 74, 0.25) !important;
      transition: all 0.3s ease !important;
    }
    .news-hot-swiper .swiper-button-next:hover,
    .news-hot-swiper .swiper-button-prev:hover {
      background: ${COLORS.gold} !important;
      color: ${COLORS.dark} !important;
      border-color: ${COLORS.gold} !important;
      box-shadow: 0 0 15px rgba(193, 155, 74, 0.4);
    }
    .news-hot-swiper .swiper-button-next::after,
    .news-hot-swiper .swiper-button-prev::after {
      font-size: 16px !important;
      font-weight: bold !important;
    }
    .news-hot-swiper .swiper-pagination-bullet {
      background: #fff !important;
      opacity: 0.35 !important;
      width: 8px !important;
      height: 8px !important;
      transition: all 0.3s ease !important;
    }
    .news-hot-swiper .swiper-pagination-bullet-active {
      background: ${COLORS.gold} !important;
      opacity: 1 !important;
      width: 28px !important;
      border-radius: 4px !important;
    }
  `;

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Open Sans', sans-serif" }}>
      {/* Khối style CSS tùy chỉnh */}
      <style>{customSwiperStyles}</style>
      
      {/* 1. HERO BANNER TIN TỨC SANG TRỌNG */}
      <div style={{ 
        position: "relative", height: "45vh", minHeight: "350px",
        backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop')",
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center"
      }}>
        {/* Lớp phủ đen tinh tế tăng tương phản */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(10,10,10,1) 100%)" }}></div>
        
        <div style={{ position: "relative", zIndex: 1, padding: "0 20px" }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Text style={{ color: COLORS.gold, textTransform: "uppercase", letterSpacing: "4px", fontWeight: "bold", fontSize: 13 }}>KHÔNG GIAN TRUYỀN THÔNG</Text>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.1 }}>
            <Title level={1} style={{ color: '#fff', fontSize: isMobile ? 38 : 58, fontFamily: "'Noto Serif', serif", margin: "15px 0 25px 0", fontWeight: 400 }}>
              Tin Tức & Sự Kiện
            </Title>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}>
            <Paragraph style={{ color: '#ccc', fontSize: 16, maxWidth: 650, margin: "0 auto" }}>
              Cập nhật các chương trình ưu đãi độc quyền, hoạt động sự kiện nổi bật và cẩm nang du lịch nghỉ dưỡng mới nhất tại IT Hotel.
            </Paragraph>
          </motion.div>
        </div>
      </div>

      <Content style={{ padding: isMobile ? "30px 15px" : "40px 80px", background: "#fff" }}>
        {/* NÚT BACK VỀ HOME */}
        <Button 
          type="link" 
          onClick={() => navigate('/')} 
          style={{ color: COLORS.gold, padding: 0, marginBottom: 35, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseEnter={(e) => e.target.style.color = "#fff"}
          onMouseLeave={(e) => e.target.style.color = COLORS.gold}
        >
          <ArrowLeftOutlined /> QUAY LẠI TRANG CHỦ
        </Button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <Text style={{ color: COLORS.gold, display: 'block', marginTop: 20, fontSize: 15 }}>Đang đồng bộ hóa dữ liệu tin tức từ cơ sở dữ liệu...</Text>
          </div>
        ) : (
          <>
            {/* 2. BANNER TIN TỨC HOT LƯỚT NGANG (HOT SLIDING BANNER) */}
            {hotArticles.length > 0 && searchQuery === "" && selectedCategoryId === "all" && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: 55 }}
              >
                <div style={{ textAlign: 'left', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <Title level={3} style={{ color: COLORS.gold, fontFamily: "'Noto Serif', serif", margin: 0, fontWeight: 300, letterSpacing: '1px' }}>Tiêu Điểm Nổi Bật</Title>
                    <div style={{ width: 60, height: 2, background: COLORS.gold, marginTop: 8 }}></div>
                  </div>
                  {!isMobile && (
                    <Text style={{ color: COLORS.gray, fontSize: 13, fontStyle: 'italic', letterSpacing: '0.5px' }}>
                      Lướt ngang để xem thêm {hotArticles.length} bài viết hot • • •
                    </Text>
                  )}
                </div>

                <Swiper
                  modules={[Autoplay, Pagination, EffectFade]}
                  effect="fade"
                  fadeEffect={{ crossFade: true }}
                  spaceBetween={30}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.65)'
                  }}
                  className="news-hot-swiper"
                >
                  {hotArticles.map((article, index) => {
                    const articleImg = getArticleImage(article, index);
                    return (
                      <SwiperSlide key={article.id} onClick={() => handleOpenDetail(article)}>
                        <div style={{
                          position: 'relative',
                          height: isMobile ? '380px' : '480px',
                          backgroundImage: `url('${articleImg}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}>
                          {/* Lớp phủ chuyển sắc tối sang trọng từ trái qua phải */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: isMobile 
                              ? 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.65) 60%, rgba(10,10,10,0.2) 100%)'
                              : 'linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 45%, rgba(10,10,10,0.2) 100%)',
                            zIndex: 1
                          }}></div>

                          {/* Nội dung tin tức nổi bật nằm đè lên lớp phủ */}
                          <div style={{
                            position: 'relative',
                            zIndex: 2,
                            width: isMobile ? '100%' : '60%',
                            padding: isMobile ? '35px 20px 40px 20px' : '60px 80px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'left'
                          }}>
                            <div>
                              <Tag style={{
                                background: COLORS.gold,
                                border: 'none',
                                color: COLORS.dark,
                                padding: '5px 14px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                marginBottom: 20
                              }}>
                                {article.category?.name || "TIN HOT"}
                              </Tag>
                            </div>

                            <Space size="large" style={{ color: COLORS.gray, marginBottom: 15, fontSize: 13 }}>
                              <span><CalendarOutlined style={{ color: COLORS.gold, marginRight: 6 }} /> {formatVietnameseDate(article.publishedAt)}</span>
                              <span><UserOutlined style={{ color: COLORS.gold, marginRight: 6 }} /> {AUTHORS[article.authorId]?.name || "Ban Truyền Thông"}</span>
                            </Space>

                            <Title level={2} style={{
                              fontFamily: "'Noto Serif', serif",
                              color: '#fff',
                              margin: "0 0 15px 0",
                              fontSize: isMobile ? 22 : 32,
                              lineHeight: 1.3,
                              fontWeight: 400,
                              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}>
                              {article.title}
                            </Title>

                            <Paragraph ellipsis={{ rows: 3 }} style={{
                              color: COLORS.gray,
                              fontSize: 15,
                              lineHeight: 1.6,
                              marginBottom: 30,
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              {stripMarkdown(article.content)}
                            </Paragraph>

                            <div>
                              <Button 
                                type="primary" 
                                size="large"
                                style={{
                                  background: 'transparent',
                                  borderColor: COLORS.gold,
                                  color: COLORS.gold,
                                  fontWeight: 'bold',
                                  padding: '0 35px',
                                  borderRadius: 24,
                                  height: 44,
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = COLORS.gold; e.target.style.color = COLORS.dark; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = COLORS.gold; }}
                              >
                                ĐỌC BÀI VIẾT
                              </Button>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </motion.div>
            )}

            {/* 3. THANH BỘ LỌC VÀ TÌM KIẾM CHUYÊN NGHIỆP */}
            <div style={{ 
              background: "#f9f9f9", 
              borderRadius: 16, 
              padding: isMobile ? "20px" : "25px 35px", 
              marginBottom: 40,
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20
            }}>
              {/* THANH TÌM KIẾM */}
              <div style={{ width: isMobile ? '100%' : '350px' }}>
                <Input
                  prefix={<SearchOutlined style={{ color: COLORS.gold, marginRight: 8 }} />}
                  placeholder="Tìm kiếm bài viết, ưu đãi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    background: '#fff', 
                    borderColor: 'rgba(0,0,0,0.1)', 
                    color: COLORS.dark,
                    height: 46,
                    borderRadius: 23,
                    fontSize: 14
                  }}
                  className="custom-search-input"
                />
              </div>

              {/* PILLS DANH MỤC */}
              <div style={{ 
                display: 'flex', 
                gap: 10, 
                flexWrap: 'wrap', 
                justifyContent: isMobile ? 'center' : 'flex-end',
                width: isMobile ? '100%' : 'auto'
              }}>
                <Button
                  onClick={() => setSelectedCategoryId("all")}
                  style={{
                    background: selectedCategoryId === "all" ? COLORS.gold : "rgba(255,255,255,0.04)",
                    borderColor: selectedCategoryId === "all" ? COLORS.gold : "transparent",
                    color: selectedCategoryId === "all" ? "#fff" : COLORS.dark,
                    borderRadius: 20,
                    fontWeight: 600,
                    height: 38,
                    padding: "0 20px"
                  }}
                >
                  Tất cả
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id.toString())}
                    style={{
                      background: selectedCategoryId === cat.id.toString() ? COLORS.gold : "rgba(255,255,255,0.04)",
                      borderColor: selectedCategoryId === cat.id.toString() ? COLORS.gold : "transparent",
                      color: selectedCategoryId === cat.id.toString() ? "#fff" : COLORS.dark,
                      borderRadius: 20,
                      fontWeight: 600,
                      height: 38,
                      padding: "0 20px"
                    }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 4. DANH SÁCH LƯỚI TIN TỨC (NEWS GRID) */}
            <div style={{ textAlign: 'left', marginBottom: 25 }}>
              <Title level={3} style={{ color: COLORS.dark, fontFamily: "'Noto Serif', serif", margin: 0, fontWeight: 300 }}>
                {searchQuery !== "" || selectedCategoryId !== "all" ? `Kết Quả Tìm Kiếm (${filteredArticles.length})` : "Tất Cả Tin Tức"}
              </Title>
              <div style={{ width: 40, height: 2, background: COLORS.gold, marginTop: 8 }}></div>
            </div>

            {filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: `1px dashed rgba(255,255,255,0.1)` }}>
                <Title level={4} style={{ color: COLORS.gold, fontWeight: 300 }}>Không tìm thấy bài viết nào!</Title>
                <Text style={{ color: COLORS.gray }}>Vui lòng thay đổi từ khóa hoặc bộ lọc danh mục.</Text>
              </div>
            ) : (
              <motion.div 
                variants={listVariant}
                initial="hidden"
                animate="show"
              >
                <Row gutter={[30, 40]}>
                  {/* Nếu đang tìm kiếm hoặc lọc danh mục, hiển thị tất cả không bỏ qua bài viết tiêu điểm */}
                  {(searchQuery !== "" || selectedCategoryId !== "all" ? filteredArticles : regularArticles).map((article, index) => {
                    const articleImg = getArticleImage(article, index + 1);
                    return (
                      <Col xs={24} md={12} lg={8} key={article.id}>
                        <motion.div variants={itemVariant} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                          <Card
                            onClick={() => handleOpenDetail(article)}
                            hoverable
                            cover={
                              <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                                <img 
                                  alt={article.title} 
                                  src={articleImg} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                  className="grid-card-img"
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)' }}></div>
                                <Tag style={{ position: 'absolute', bottom: 15, left: 15, background: 'rgba(10, 10, 10, 0.75)', border: `1px solid ${COLORS.gold}`, color: COLORS.gold, backdropFilter: 'blur(5px)', borderRadius: 4 }}>
                                  {article.category?.name || "Tin tức"}
                                </Tag>
                              </div>
                            }
                            bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 260 }}
                            style={{ 
                              background: COLORS.cardBg, 
                              border: `1px solid ${COLORS.border}`, 
                              borderRadius: 16, 
                              overflow: 'hidden',
                              backdropFilter: "blur(5px)"
                            }}
                          >
                            <Space size="middle" style={{ color: COLORS.gray, fontSize: 11, marginBottom: 12 }}>
                              <span><CalendarOutlined style={{ color: COLORS.gold, marginRight: 4 }} /> {formatVietnameseDate(article.publishedAt)}</span>
                              <span><UserOutlined style={{ color: COLORS.gold, marginRight: 4 }} /> {AUTHORS[article.authorId]?.name.split(' ').pop() || "Admin"}</span>
                            </Space>

                            <Title level={4} style={{ 
                              color: COLORS.dark, 
                              margin: "0 0 12px 0", 
                              fontFamily: "'Noto Serif', serif",
                              fontSize: 17,
                              lineHeight: 1.4,
                              height: 48,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {article.title}
                            </Title>

                            <Paragraph style={{ 
                              color: COLORS.gray, 
                              fontSize: 13, 
                              lineHeight: 1.5,
                              marginBottom: 20,
                              height: 58,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {stripMarkdown(article.content)}
                            </Paragraph>

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }} className="read-more-link">
                                ĐỌC CHI TIẾT →
                              </Text>
                              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}><EyeOutlined /> Xem</Text>
                            </div>
                          </Card>
                        </motion.div>
                      </Col>
                    );
                  })}
                </Row>
              </motion.div>
            )}
          </>
        )}
      </Content>

      {/* 5. MODAL XEM CHI TIẾT BÀI VIẾT (EDITORIAL STYLE MODAL) */}
      <AnimatePresence>
        {detailModalOpen && selectedArticle && (
          <Modal
            open={detailModalOpen}
            onCancel={() => setDetailModalOpen(false)}
            footer={null}
            width={850}
            bodyStyle={{ padding: 0, background: '#fff' }}
            centered
            className="premium-article-modal"
            closeIcon={<span style={{ color: COLORS.dark, fontSize: 18, background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '50%' }}>✕</span>}
          >
            {/* Ảnh cover trong modal */}
            <div style={{ height: isMobile ? 220 : 380, position: 'relative', overflow: 'hidden' }}>
              <img 
                src={getArticleImage(selectedArticle, articles.indexOf(selectedArticle))} 
                alt={selectedArticle.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 60%)' }}></div>
              <Tag style={{ position: 'absolute', top: 25, left: 25, background: COLORS.gold, color: COLORS.dark, border: 'none', padding: '6px 16px', fontWeight: 'bold', borderRadius: 4 }}>
                {selectedArticle.category?.name || "Tin tức"}
              </Tag>
            </div>

            {/* Nội dung bài viết */}
            <div style={{ padding: isMobile ? "25px 20px" : "35px 45px", background: "#fff", color: COLORS.dark }}>
              <Space size="large" style={{ color: COLORS.gray, marginBottom: 20, fontSize: 13, display: 'flex', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><CalendarOutlined style={{ color: COLORS.gold, marginRight: 6 }} /> {formatVietnameseDate(selectedArticle.publishedAt)}</span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar size="small" src={AUTHORS[selectedArticle.authorId]?.avatar} style={{ marginRight: 8 }} />
                  {AUTHORS[selectedArticle.authorId]?.name || "Ban Truyền Thông"}
                </span>
              </Space>

              <Title level={2} style={{ color: '#fff', fontFamily: "'Noto Serif', serif", fontSize: isMobile ? 22 : 32, lineHeight: 1.3, marginBottom: 25, fontWeight: 400 }}>
                {selectedArticle.title}
              </Title>

              <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '0 0 25px 0' }} />

              {/* Phần nội dung chi tiết dạng văn bản */}
              <div data-color-mode="light" style={{ 
                color: COLORS.dark, 
                fontSize: 16, 
                lineHeight: 1.8, 
                textAlign: 'justify',
                maxHeight: '40vh',
                overflowY: 'auto',
                paddingRight: 10
              }} className="article-modal-content">
                <MDEditor.Markdown source={selectedArticle.content} style={{ background: 'transparent', color: COLORS.dark }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <Button 
                  onClick={() => setDetailModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'transparent', color: '#fff', borderRadius: 20, padding: '0 25px' }}
                >
                  ĐÓNG CỬA SỔ
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default NewsPage;
