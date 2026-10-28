import React, { useRef, useState, useEffect } from 'react';
import { Layout, Button, Typography, Row, Col, Space, Tag, Avatar, Divider, Dropdown, DatePicker, InputNumber, Modal, Drawer, message } from 'antd';
import {
  ArrowRightOutlined, ArrowLeftOutlined, EnvironmentOutlined, MenuOutlined,
  FacebookFilled, InstagramFilled, TwitterOutlined,
  PhoneOutlined, MailOutlined, UserOutlined, LogoutOutlined,
  SunOutlined, MoonOutlined, SearchOutlined
} from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Mousewheel, Pagination } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios'; // 🚨 NHỚ PHẢI CÓ AXIOS ĐỂ GỌI API
import { getUserRoles } from '../utils/auth'; // 🔥 LẤY ROLES TỪ JWT TOKEN

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// Import CSS
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

gsap.registerPlugin(ScrollTrigger);

const { Header } = Layout;
const { Title, Text, Paragraph } = Typography;

const COLORS = {
  gold: "#c19b4a",
  dark: "#0a0a0a",
  gray: "#8c8c8c",
  bg: "#f8fafc",
  white: "#ffffff",
  border: "#eeeeee"
};

const stripMarkdown = (md = "") => {
  if (!md) return "";
  return md
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[.*?\]\(.*?\)/g, "") // remove links
    .replace(/#{1,6}\s+/g, "") // remove headers
    .replace(/[*_`~]/g, "") // remove formatting characters
    .trim();
};

// Helper function to map category names to premium unsplash images
const getCategoryImageUrl = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("nhà hàng") || n.includes("ẩm thực") || n.includes("restaurant") || n.includes("food")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("spa") || n.includes("massage") || n.includes("thư giãn") || n.includes("wellness")) {
    return "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("bar") || n.includes("lounge") || n.includes("rượu") || n.includes("cocktail")) {
    return "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("bể bơi") || n.includes("hồ bơi") || n.includes("pool") || n.includes("swimming")) {
    return "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("giặt") || n.includes("laundry") || n.includes("ủi")) {
    return "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("phòng") || n.includes("gym") || n.includes("thể hình")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop"; // Default hotel image
};

const getCategoryIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("nhà hàng") || n.includes("ẩm thực") || n.includes("restaurant") || n.includes("food")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/2737/2737035.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  if (n.includes("spa") || n.includes("massage") || n.includes("thư giãn") || n.includes("wellness")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/3130/3130456.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  if (n.includes("bar") || n.includes("lounge") || n.includes("rượu") || n.includes("cocktail")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/924/924514.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  if (n.includes("bể bơi") || n.includes("hồ bơi") || n.includes("pool") || n.includes("swimming")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/3144/3144583.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  if (n.includes("giặt") || n.includes("laundry") || n.includes("ủi")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/2970/2970923.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  if (n.includes("phòng") || n.includes("gym") || n.includes("thể hình")) {
    return <img src="https://cdn-icons-png.flaticon.com/512/2964/2964514.png" width={24} style={{ filter: 'invert(1)' }} />;
  }
  return <img src="https://cdn-icons-png.flaticon.com/512/1475/1475996.png" width={24} style={{ filter: 'invert(1)' }} />;
};

const getAttractionImage = (name = "", index) => {
  const n = name.toLowerCase();
  if (n.includes("bà nà") || n.includes("ba na")) {
    return "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("rồng") || n.includes("dragon")) {
    return "https://images.unsplash.com/photo-1583417267846-e58bf43e80b2?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("mỹ khê") || n.includes("my khe") || n.includes("biển") || n.includes("beach")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("ngũ hành") || n.includes("ngu hanh")) {
    return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("hội an") || n.includes("hoi an")) {
    return "https://images.unsplash.com/photo-1596395825390-e55500e57ba5?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("sơn trà") || n.includes("son tra") || n.includes("bán đảo")) {
    return "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("đi bộ") || n.includes("walking")) {
    return "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("đà lạt") || n.includes("da lat")) {
    return "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("chợ") || n.includes("market")) {
    return "https://images.unsplash.com/photo-1543083503-0c3b01a700c8?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("thương mại") || n.includes("mall") || n.includes("shopping")) {
    return "https://images.unsplash.com/photo-1567401893930-7bec752b4d85?q=80&w=1200&auto=format&fit=crop";
  }
  if (n.includes("bảo tàng") || n.includes("museum")) {
    return "https://images.unsplash.com/photo-1566121318576-53b482db0e26?q=80&w=1200&auto=format&fit=crop";
  }
  const fallbackImages = [
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583417267846-e58bf43e80b2?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596395825390-e55500e57ba5?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
  ];
  return fallbackImages[index % fallbackImages.length];
};

// ==========================================
// COMPONENT HIỆU ỨNG 
// ==========================================
const SunRays = React.memo(({ isActive }) => {
  if (!isActive) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(255,250,220,0.9) 0%, rgba(255,230,150,0.3) 40%, transparent 70%)',
          filter: 'blur(40px)', mixBlendMode: 'screen'
        }}
      />
    </div>
  );
});

const BlingBling = React.memo(({ isActive }) => {
  if (!isActive) return null;
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 5 + 4,
    delay: Math.random() * 3,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], y: -120, x: -80, scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute', left: p.left, top: p.top, width: p.size, height: p.size,
            backgroundColor: '#fff', borderRadius: '50%',
            boxShadow: '0 0 10px 2px rgba(255, 220, 100, 0.6), 0 0 20px 4px rgba(255, 255, 255, 0.4)'
          }}
        />
      ))}
    </div>
  );
});

// ==========================================
// TRANG CHỦ CHÍNH
// ==========================================
const HomePage = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverReceptionist, setHoverReceptionist] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false); // Mặc định là Ban ngày khi vừa vào trang

  const videoHeroRef = useRef(null);
  const rewindIntervalRef = useRef(null);
  const isSeekingRef = useRef(false);

  const toggleDayNight = () => {
    const video = videoHeroRef.current;
    if (!video) return;

    if (rewindIntervalRef.current) {
      clearInterval(rewindIntervalRef.current);
      rewindIntervalRef.current = null;
    }

    if (!isNightMode) {
      // ĐANG LÀ NGÀY -> CHUYỂN SANG ĐÊM: Phát video xuôi
      setIsNightMode(true);
      video.playbackRate = 1.5; // Phát nhanh hơn một chút cho hiệu ứng đẹp
      video.play().catch(e => console.log("Lỗi phát video:", e));
    } else {
      // ĐANG LÀ ĐÊM -> CHUYỂN SANG NGÀY: Tua ngược về 0s
      setIsNightMode(false);
      video.pause();
      rewindIntervalRef.current = setInterval(() => {
        if (!videoHeroRef.current || videoHeroRef.current.currentTime <= 0.1) {
          if (videoHeroRef.current) videoHeroRef.current.currentTime = 0;
          clearInterval(rewindIntervalRef.current);
          rewindIntervalRef.current = null;
        } else {
          videoHeroRef.current.currentTime -= 0.15; // Tua ngược 0.15s mỗi 30ms
        } 
      }, 30);
    }
  };

  const heroImages = {
    day: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2000&auto=format&fit=crop",
    night: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2000&auto=format&fit=crop"
  };

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 20;
    const y = (e.clientY / innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => setIntroComplete(true), 2200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // --- STATE DỮ LIỆU ---
  const [roomsData, setRoomsData] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // --- STATE DỊCH VỤ TIỆN ÍCH ---
  const [servicesData, setServicesData] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // --- STATE KHÁM PHÁ (ATTRACTIONS) ---
  const [attractionsData, setAttractionsData] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [activeAttrIndex, setActiveAttrIndex] = useState(0);

  useEffect(() => {
    // Tự động cuộn phần tử sidebar đang active vào vùng hiển thị
    const activeEl = document.querySelector('.attr-sidebar-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeAttrIndex]);

  const getMapEmbed = (dest) => {
    if (dest?.mapEmbedLink && dest.mapEmbedLink.includes('<iframe')) {
      const match = dest.mapEmbedLink.match(/src="([^"]+)"/);
      if (match) return match[1];
    }
    if (dest?.mapEmbedLink && dest.mapEmbedLink.startsWith('http')) {
      return dest.mapEmbedLink;
    }
    const name = dest?.name ? dest.name.toLowerCase() : '';
    if (name.includes('bà nà') || name.includes('ba na')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3835.733390389332!2d107.98504031536067!3d15.996803988925586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421b0615555555%3A0x3f5c3fa910900000!2sSun%20World%20Ba%20Na%20Hills!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s";
    } else if (name.includes('mỹ khê') || name.includes('my khe')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.834460515152!2d108.24138091536187!3d16.07361198887824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142177f2ced6d8b%3A0xeac35f2960ca74a4!2sMy%20Khe%20Beach!5e0!3m2!1sen!2s!4v1620000000001!5m2!1sen!2s";
    } else if (name.includes('rồng') || name.includes('dragon')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.110435405456!2d108.22684831536173!3d16.060280988886326!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142183313936999%3A0x892a0885e3b56754!2sDragon%20Bridge!5e0!3m2!1sen!2s!4v1620000000002!5m2!1sen!2s";
    } else if (name.includes('sơn trà') || name.includes('son tra')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3832.61053186259!2d108.27718031536267!3d16.12217698884902!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142171120000000%3A0x1000000000000000!2sLinh%20Ung%20Pagoda!5e0!3m2!1sen!2s!4v1620000000003!5m2!1sen!2s";
    } else if (name.includes('ngũ hành') || name.includes('ngu hanh')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3835.7289456565637!2d108.261803988925586!3d16.002803988925586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142108155555555%3A0x140508000000000!2sNgu%20Hanh%20Son!5e0!3m2!1sen!2s!4v1620000000005!5m2!1sen!2s";
    } else if (name.includes('hội an') || name.includes('hoi an')) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3836.733390389332!2d108.326803988925586!3d15.872803988925586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31420ddb21000001%3A0x190800000000000!2sHoi%20An%20Ancient%20Town!5e0!3m2!1sen!2s!4v1620000000006!5m2!1sen!2s";
    } else {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.5152281729!2d108.15175825227747!3d16.05975819777978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x1df0cb4b86727e06!2sDa%20Nang%2C%20Vietnam!5e0!3m2!1sen!2s!4v1620000000004!5m2!1sen!2s";
    }
  };

  // --- STATE TIN TỨC TRANG CHỦ ---
  const [newsData, setNewsData] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // --- STATE TIN TỨC & BÀI VIẾT THEO SECTION ---
  const [cauChuyenPosts, setCauChuyenPosts] = useState([]);
  const [khamPhaPosts, setKhamPhaPosts] = useState([]);
  const [tienIchPosts, setTienIchPosts] = useState([]);

  // --- STATE NGƯỜI DÙNG (AUTH) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeScene, setActiveScene] = useState(0);
  // State quản lý bộ lọc tìm kiếm
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [adults, setAdults] = useState(2); 
  const [children, setChildren] = useState(0); 

  // ==================================================================================
  // HÀM XỬ LÝ TÌM KIẾM PHÒNG
  // ==================================================================================
  const handleSearchRooms = () => {
    const params = new URLSearchParams();
    if (checkIn) params.append('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.append('checkOut', checkOut.format('YYYY-MM-DD'));
    params.append('adults', adults);
    params.append('children', children);
    navigate(`/rooms?${params.toString()}`);
  };

  // Hàm xử lý khi bấm nút ĐẶT NGAY
  const handleBookRoom = (e, roomName) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      message.warning("Vui lòng đăng nhập với tài khoản Khách hàng (Guest) để đặt phòng trực tuyến.");
      navigate("/login");
      return;
    }
    const roles = getUserRoles();
    if (!roles.includes("Guest")) {
      message.error("Chỉ có tài khoản Khách hàng (Guest) mới có quyền đặt phòng trực tuyến!");
      return;
    }
    navigate(`/rooms?quickBookRoomName=${encodeURIComponent(roomName)}`);
  };

  // 🚨 1. KIỂM TRA ĐĂNG NHẬP KHI VÀO TRANG
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      const userObj = JSON.parse(userStr);
      // 🔥 Lấy roles từ JWT token (không phải từ user object)
      const rolesFromToken = getUserRoles();
      // Gắn roles vào user object để dùng trong component
      userObj.roles = rolesFromToken;
      setIsLoggedIn(true);
      setCurrentUser(userObj);
    }
  }, []);

  // 🚨 2. LẤY DỮ LIỆU PHÒNG TỪ SQL SERVER
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/RoomTypes/public`);
        setRoomsData(response.data);
      } catch (error) {
        console.error("Lỗi khi tải bộ sưu tập phòng:", error);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // 🚨 3. LẤY DỮ LIỆU DỊCH VỤ TIỆN ÍCH TỪ SQL SERVER
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/Services/categories/public`);
        // Lọc ra các danh mục có ít nhất 1 dịch vụ
        setServicesData(res.data.filter(cat => cat.services && cat.services.length > 0));
      } catch (error) {
        console.error("Lỗi khi tải dịch vụ tiện ích:", error);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // 🚨 4. LẤY DỮ LIỆU KHÁM PHÁ (ATTRACTIONS) TỪ SQL SERVER
  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/Attractions`);
        setAttractionsData(res.data || []);
      } catch (error) {
        console.error("Lỗi khi tải địa điểm du lịch:", error);
      } finally {
        setLoadingAttractions(false);
      }
    };
    fetchAttractions();
  }, []);

  // 🚨 5. LẤY DỮ LIỆU BÀI VIẾT THEO CÁC PHÂN VÙNG
  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/Posts`);
        const published = (res.data || []).filter(x => x.isPublished);
        
        // Sắp xếp bài viết: điểm hot (isHot) lên đầu, sau đó theo ngày tạo (createdAt) giảm dần
        const sorted = [...published].sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Lọc theo phân vùng dựa trên danh mục hiển thị
        setTienIchPosts(sorted.filter(x => x.categoryName && x.categoryName.toLowerCase().includes('tiện ích')));
        setKhamPhaPosts(sorted.filter(x => x.categoryName && x.categoryName.toLowerCase().includes('khám phá')));
        setCauChuyenPosts(sorted.filter(x => x.categoryName && (x.categoryName.toLowerCase().includes('câu chuyện') || x.categoryName.toLowerCase().includes('tin tức')) || x.isHot));
        
        // Mặc định cho newsData là các bài viết câu chuyện hoặc hot news
        setNewsData(sorted.filter(x => x.isHot || (x.categoryName && (x.categoryName.toLowerCase().includes('câu chuyện') || x.categoryName.toLowerCase().includes('tin tức')))));
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchLatestNews();
  }, []);

  // --- HÀM XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.reload(); // Ép load lại trang cho sạch sẽ
  };

  // --- ĐỊNH DẠNG CHỨC VỤ ---
  const getRoleDisplay = () => {
    if (!currentUser?.roles) return { name: 'KHÁCH', color: COLORS.gray };
    if (currentUser.roles.includes('Admin')) return { name: 'QUẢN LÝ', color: '#f5222d' };
    if (currentUser.roles.includes('Receptionist')) return { name: 'LỄ TÂN', color: '#1890ff' };
    if (currentUser.roles.includes('Guest')) return { name: 'KHÁCH HÀNG', color: COLORS.gold };
    return { name: 'KHÁCH', color: COLORS.gray };
  };

  const roleInfo = getRoleDisplay();

  const menuItems = [
    { key: 'home', label: 'Trang chủ', path: '/homepage', type: 'link' },
    { key: 'rooms', label: 'Đặt Phòng', path: '/rooms', type: 'link' },
    { key: 'about', label: 'Giới thiệu', path: '/about', type: 'link' },
    { key: 'contact', label: 'Liên hệ', path: '/contact', type: 'link' },
  ];

  const zoomVariant = {
    hidden: { scale: 1.2, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 1.5, ease: "easeOut" } }
  };

  const lenisRef = useRef(null);

  // Khởi tạo Lenis Smooth Scroll theo yêu cầu
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToScene = (index) => {
    setActiveScene(index);
    const element = document.getElementById(`scene-${index}`);
    if (element) {
      if (lenisRef.current) {
        // Tận dụng sức mạnh của Lenis để scroll mượt tới section
        lenisRef.current.scrollTo(element);
      } else {
        // Fallback native behavior
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      const totalScenes = 6;
      for (let i = 0; i < totalScenes; i++) {
        const sec = document.getElementById(`scene-${i}`);
        if (sec) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveScene(i);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hàm điều hướng đến trang phù hợp theo role
  const handleProfileNavigation = () => {
    if (currentUser?.roles?.includes('Admin')) {
      navigate('/admin/users');
    } else if (currentUser?.roles?.includes('Receptionist')) {
      navigate('/receptionist/dashboard');
    } else {
      navigate('/guest/dashboard');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ của tôi', icon: <UserOutlined />, onClick: handleProfileNavigation },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout }
  ];

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } } };
  const pushUpVariant = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } } };
  const bgScaleVariant = { hidden: { scale: 1.1 }, visible: { scale: 1, transition: { duration: 1.5, ease: "easeOut" } } };

  // Thêm scroll-triggered animations với staggered reveal theo yêu cầu
  const sectionVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.25, 0.1, 0.25, 1], // Custom easing curve
        staggerChildren: 0.15 
      }
    }
  };

  const glassStyle = {
    background: "rgba(10, 10, 10, 0.7)", backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px", padding: isMobile ? "20px" : "40px"
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: COLORS.dark, fontFamily: "'Open Sans', sans-serif", overflowX: "hidden", position: "relative" }}>

      {/* 🚨 KỊCH BẢN MÀN CHÀO HỎI (INTRO CURTAIN DROP) */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: introComplete ? "-100vh" : 0 }}
        transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
        style={{
          position: "fixed", inset: 0, zIndex: 999999, background: "#050505", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1.1, 1.2] }}
          transition={{ duration: 2.0, ease: "easeInOut" }}
          style={{ textAlign: "center" }}
        >
          <div style={{
            width: 100, height: 100, borderRadius: '50%', border: '2px solid #D4AF37', margin: '0 auto 24px auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)'
          }}>
            <Title level={2} style={{ margin: 0, color: '#D4AF37', fontFamily: "'Noto Serif', serif" }}>IT</Title>
          </div>
          <Title level={1} style={{ margin: 0, color: '#ffffff', letterSpacing: '8px', fontSize: 42, fontFamily: "'Noto Serif', serif", textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
            IT HOTEL
          </Title>
          <Text style={{ color: '#D4AF37', letterSpacing: '6px', fontSize: 14, textTransform: 'uppercase', display: 'block', marginTop: 12 }}>
            LUXURY RESORT & SPA
          </Text>
        </motion.div>
      </motion.div>

      {/* ================================================================================== */}
      {/* HEADER: THIẾT KẾ THEO MẪU HÌNH ẢNH (LOGO GRAND) */}
      {/* ================================================================================== */}
      <Header style={{
        // LỚP NỀN BẢO VỆ HEADER: TẠO DẢI TỐI NHẸ Ở TRÊN CÙNG ĐỂ CHỮ LUÔN RÕ
        background: activeScene > 0 
          ? COLORS.white 
          : (isNightMode ? "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" : "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 100%)"),
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: isMobile ? "0 20px" : "0 80px", height: "80px",
        position: "fixed", top: 0, zIndex: 1000, width: "100%", 
        backdropFilter: activeScene > 0 ? "blur(15px)" : "blur(5px)",
        borderBottom: activeScene > 0 ? `1px solid ${COLORS.border}` : "none",
        transition: "all 0.5s ease"
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/homepage')}>
          <Title level={3} style={{ 
            margin: 0, 
            color: activeScene > 0 ? COLORS.dark : '#fff', 
            letterSpacing: '2px', fontFamily: "'Noto Serif', serif",
            textShadow: activeScene > 0 ? "none" : "0 2px 10px rgba(0,0,0,0.6)",
            transition: "all 0.5s ease"
          }}>
            IT HOTEL
          </Title>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '40px' }}>
            {[
              { label: 'Trang chủ', path: '/homepage' },
              { label: 'Phòng nghỉ', path: '/rooms' },
              { label: 'Giới thiệu', path: '/about' },
              { label: 'Liên hệ', path: '/contact' }
            ].map((item, idx) => {
              const isActive = window.location.pathname === item.path;
              const textColor = activeScene > 0 ? COLORS.dark : '#fff';
              return (
                <Text 
                  key={idx} 
                  style={{ 
                    cursor: 'pointer', fontWeight: 500, 
                    color: isActive ? COLORS.gold : textColor,
                    fontSize: 14, 
                    textShadow: activeScene > 0 ? "none" : "0 2px 8px rgba(0,0,0,0.6)",
                    transition: "all 0.5s ease",
                    textTransform: 'uppercase', // Làm Menu trông chuyên nghiệp hơn
                    letterSpacing: '1px'
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Text>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          {isLoggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar src={currentUser?.avatar} icon={<UserOutlined />} />
                {!isMobile && (
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <Text strong style={{ 
                      fontSize: 12, 
                      color: activeScene > 0 ? COLORS.dark : '#fff',
                      textShadow: activeScene > 0 ? "none" : "0 1px 5px rgba(0,0,0,0.6)",
                      transition: "color 0.5s ease"
                    }}>
                      {currentUser?.fullName || 'Khách'}
                    </Text>
                    <Text style={{ fontSize: 10, color: roleInfo.color, fontWeight: 'bold' }}>{roleInfo.name}</Text>
                  </div>
                )}
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')} style={{ background: COLORS.gold, border: 'none', fontWeight: 'bold', borderRadius: 8 }}>LOGIN</Button>
          )}
        </div>
      </Header>

      {/* ================================================================================== */}
      {/* MAIN LAYOUT */}
      {/* ================================================================================== */}
      <div style={{ width: "100%" }}>

        {/* === SCENE 0: HERO VILLA NGÀY / ĐÊM === */}
        <div id="scene-0" style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
          <motion.video
            ref={videoHeroRef}
            src="https://res.cloudinary.com/dqx8hqmcv/video/upload/f_auto,q_auto/v1778852147/QuanTriKhachSan/video_showcase.mp4"
            playsInline webkit-playsinline="true" muted preload="auto"
            variants={zoomVariant} initial="hidden" animate="visible"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
          />
          {/* LỚP PHỦ VIDEO: THÍCH ỨNG THEO CHẾ ĐỘ NGÀY/ĐÊM ĐỂ NỔI BẬT NỘI DUNG */}
          <div style={{ 
            position: "absolute", inset: 0, zIndex: 2, 
            background: isNightMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.42)",
            transition: "background 0.8s ease" 
          }} />

          {/* === NÚT CHUYỂN ĐỔI NGÀY/ĐÊM (RESTORED) === */}
          <div style={{ position: 'absolute', bottom: isMobile ? 30 : 60, left: isMobile ? 20 : 80, zIndex: 100 }}>
            <Button
              type="primary"
              shape="round"
              icon={isNightMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleDayNight}
              style={{
                background: isNightMode ? 'rgba(255, 255, 255, 0.15)' : COLORS.gold,
                borderColor: isNightMode ? 'rgba(255, 255, 255, 0.3)' : COLORS.gold,
                color: isNightMode ? '#fff' : COLORS.dark,
                backdropFilter: 'blur(10px)',
                fontWeight: 'bold', height: 45, padding: '0 25px',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s'
              }}
            >
              {!isMobile && (isNightMode ? "CHẾ ĐỘ BAN NGÀY" : "CHẾ ĐỘ BAN ĐÊM")}
            </Button>
          </div>

          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            animate={activeScene === 0 ? "visible" : "hidden"}
            style={{ 
              position: "absolute", // Chuyển sang tuyệt đối để căn giữa chính xác
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10, width: "100%", maxWidth: "1200px",
              textAlign: "center", padding: "0 20px" 
            }}>
            
            {/* === CỘT TRÁI: NỘI DUNG VÀ TÌM PHÒNG (CĂN GIỮA VỚI NỀN BẢO VỆ) === */}
            <div style={{ 
              margin: '0 auto', textAlign: 'center', maxWidth: '900px', 
              padding: '40px', borderRadius: '30px',
              // LỚP NỀN BẢO VỆ VĂN BẢN: TẠO VÙNG TỐI BÁN TRONG SUỐT ĐỂ CHỮ MÀU SÁNG NỔI BẬT
              background: "radial-gradient(circle, rgba(0,0,0,0.55) 0%, transparent 85%)",
              transition: "all 0.8s ease"
            }}>
              <motion.div variants={pushUpVariant}>
                <Text style={{ 
                  color: COLORS.gold, 
                  textTransform: "uppercase", letterSpacing: "5px", 
                  fontWeight: "bold", marginBottom: 15, display: 'block',
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  transition: "color 0.8s ease"
                }}>
                  TRẢI NGHIỆM ĐẲNG CẤP 5 SAO
                </Text>
              </motion.div>
              
              <motion.div variants={pushUpVariant}>
                <Title level={1} style={{ 
                  color: '#fff', 
                  fontSize: isMobile ? 36 : 72, 
                  fontFamily: "'Noto Serif', serif", 
                  fontWeight: 800,
                  lineHeight: 1.1, margin: "10px 0",
                  // TĂNG CƯỜNG BÓNG ĐỔ ĐA TẦNG ĐỂ CHỮ RÕ NÉT TRÊN MỌI NỀN
                  textShadow: "0 4px 15px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)",
                  transition: "all 0.8s ease"
                }}>
                  Nơi Tuyệt Tác <br /> Kiến Trúc <span style={{ color: COLORS.gold }}>Thăng Hoa</span>
                </Title>
                <Paragraph style={{ 
                  color: 'rgba(255,255,255,0.92)', 
                  fontSize: 18, maxWidth: 700, margin: "20px auto 50px auto",
                  fontWeight: 500,
                  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                  transition: "all 0.8s ease"
                }}>
                  Tận hưởng kỳ nghỉ trong mơ tại thiên đường nghỉ dưỡng hàng đầu, nơi kiến trúc đỉnh cao gặp gỡ dịch vụ cá nhân hóa tuyệt đối.
                </Paragraph>
              </motion.div>

            {/* THANH TÌM KIẾM CĂN GIỮA - THÍCH ỨNG MÀU SẮC */}
            <motion.div variants={pushUpVariant} style={{ width: "100%", maxWidth: 1000 }}>
              <div style={{
                background: isNightMode ? "rgba(255,255,255,0.95)" : "#fff", 
                borderRadius: 16, padding: "15px 30px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: isNightMode ? "0 20px 50px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.15)",
                transition: "all 0.8s ease",
                border: isNightMode ? "none" : "1px solid rgba(0,0,0,0.05)"
              }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Text style={{ color: COLORS.gray, display: 'block', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }}>NHẬN PHÒNG</Text>
                  <DatePicker 
                    bordered={false} 
                    placeholder="mm/dd/yyyy" 
                    style={{ padding: 0, width: '100%', fontSize: 15 }} 
                    onChange={(date) => setCheckIn(date)}
                  />
                </div>
                
                <Divider type="vertical" style={{ height: 40, background: '#eee', margin: '0 30px' }} />
                
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Text style={{ color: COLORS.gray, display: 'block', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }}>TRẢ PHÒNG</Text>
                  <DatePicker 
                    bordered={false} 
                    placeholder="mm/dd/yyyy" 
                    style={{ padding: 0, width: '100%', fontSize: 15 }} 
                    onChange={(date) => setCheckOut(date)}
                  />
                </div>
                
                <Divider type="vertical" style={{ height: 40, background: '#eee', margin: '0 30px' }} />
                
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Text style={{ color: COLORS.gray, display: 'block', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }}>NGƯỜI LỚN</Text>
                  <Dropdown menu={{ items: [1, 2, 3, 4].map(n => ({ key: n, label: `${n} Người lớn`, onClick: () => setAdults(n) })) }}>
                    <div style={{ cursor: 'pointer', fontSize: 15, color: COLORS.dark, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {adults} Người <ArrowRightOutlined rotate={90} style={{ fontSize: 10, color: COLORS.gold }} />
                    </div>
                  </Dropdown>
                </div>

                <Divider type="vertical" style={{ height: 40, background: '#eee', margin: '0 20px' }} />

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Text style={{ color: COLORS.gray, display: 'block', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }}>TRẺ EM</Text>
                  <Dropdown menu={{ items: [0, 1, 2, 3].map(n => ({ key: n, label: `${n} Trẻ em`, onClick: () => setChildren(n) })) }}>
                    <div style={{ cursor: 'pointer', fontSize: 15, color: COLORS.dark, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {children} Trẻ em <ArrowRightOutlined rotate={90} style={{ fontSize: 10, color: COLORS.gold }} />
                    </div>
                  </Dropdown>
                </div>
                
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<SearchOutlined />}
                  onClick={handleSearchRooms}
                  style={{ 
                    background: COLORS.gold, border: 'none', width: 60, height: 60, 
                    borderRadius: 12, marginLeft: 20, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center' 
                  }}
                />
              </div>
            </motion.div>
            </div> {/* ĐÓNG LỚP NỀN BẢO VỆ VĂN BẢN (div dòng 565) */}
          </motion.div>
        </div>

        {/* === SCENE 1: BỘ SƯU TẬP PHÒNG (MẪU 1: TRẮNG SANG TRỌNG) === */}
        <div id="scene-1" style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants} style={{ position: "relative", width: "100%", padding: isMobile ? "120px 20px 60px" : "120px 80px 60px" }}>
            
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Text style={{ color: COLORS.gray, textTransform: "uppercase", letterSpacing: "5px", fontWeight: 'bold', fontSize: 11 }}>BỘ SƯU TẬP</Text>
                <Title level={1} style={{ margin: "10px 0", fontSize: isMobile ? 36 : 64, color: COLORS.dark, fontFamily: "'Noto Serif', serif", fontWeight: 400 }}>
                  Không Gian <i style={{ fontWeight: 300 }}>Nghỉ Dưỡng</i>
                </Title>
                <Paragraph style={{ color: COLORS.gray, fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
                  Mỗi căn phòng là một tác phẩm — nơi thiết kế tinh tế gặp gỡ sự thoải mái tuyệt đối
                </Paragraph>
              </motion.div>
            </div>

            <div>
              {loadingRooms ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Text style={{ color: COLORS.gold }}>Đang tải bộ sưu tập...</Text>
                </div>
              ) : (
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={0}
                  slidesPerView={1}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  pagination={{ clickable: true, renderBullet: (index, className) => `<span class="${className}"></span>` }}
                  style={{ width: '100%' }}
                >
                  {roomsData.map((room, index) => {
                    const roomIndex = (index + 1).toString().padStart(2, '0');
                    const totalRooms = roomsData.length.toString().padStart(2, '0');
                    const amenitiesArray = room.amenities ? room.amenities.split(',').map(a => a.trim()).slice(0, 5) : ['Wifi miễn phí', 'TV 50 inch', 'Minibar', 'Két an toàn', 'Điều hòa'];
                    const roomImage = room.images && room.images.length > 0 ? room.images[0].imageUrl : "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop";

                    return (
                      <SwiperSlide key={room.id}>
                        <Row gutter={[60, 40]} align="middle">
                          {/* CỘT THÔNG TIN (BÊN TRÁI) */}
                          <Col xs={24} md={10}>
                            <div style={{ textAlign: 'left', paddingRight: isMobile ? 0 : 40 }}>
                              <div style={{ marginBottom: 30 }}>
                                <Text style={{ color: COLORS.gray, letterSpacing: 2, fontSize: 13 }}>{roomIndex} ——— {totalRooms}</Text>
                              </div>
                              
                              <Title level={1} style={{ fontFamily: "'Noto Serif', serif", color: COLORS.dark, fontSize: isMobile ? 32 : 48, fontWeight: 400, marginBottom: 20 }}>
                                {room.name}
                              </Title>
                              
                              <Space size={30} style={{ color: COLORS.gray, marginBottom: 30, fontSize: 14 }}>
                                <span><img src="https://cdn-icons-png.flaticon.com/512/3030/3030336.png" width={16} style={{ marginRight: 8, opacity: 0.6 }} /> {room.sizeSqm}m²</span>
                                <span><img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" width={16} style={{ marginRight: 8, opacity: 0.6 }} /> {room.capacityAdults} khách</span>
                              </Space>
                              
                              <Paragraph style={{ color: COLORS.gray, fontSize: 16, lineHeight: 1.8, marginBottom: 30 }}>
                                {room.description || "Phòng sang trọng với thiết kế hiện đại, view thành phố tuyệt đẹp."}
                              </Paragraph>

                              <Space size={[8, 8]} wrap style={{ marginBottom: 40 }}>
                                {amenitiesArray.map(item => (
                                  <span key={item} style={{ background: '#f5f5f5', color: COLORS.gray, padding: '6px 16px', fontSize: 12, borderRadius: 2 }}>{item}</span>
                                ))}
                              </Space>

                              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 30 }}>
                                <div>
                                  {room.originalPrice && room.originalPrice > room.basePrice && <Text delete style={{ color: '#ccc', fontSize: 14, display: 'block' }}>{new Intl.NumberFormat('vi-VN').format(room.originalPrice)}đ</Text>}
                                  <Title level={2} style={{ margin: 0, color: COLORS.dark, fontSize: 32, fontWeight: 500 }}>
                                    {new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ<span style={{ fontSize: 14, color: COLORS.gray, fontWeight: 400 }}> /đêm</span>
                                  </Title>
                                </div>

                                <Button
                                  type="primary"
                                  onClick={(e) => handleBookRoom(e, room.name)}
                                  style={{ 
                                    background: COLORS.dark, 
                                    color: '#fff', 
                                    border: 'none',
                                    borderRadius: 0,
                                    height: 54,
                                    padding: '0 40px',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    letterSpacing: 2
                                  }}
                                >
                                  ĐẶT NGAY
                                </Button>
                              </div>
                            </div>
                          </Col>

                          {/* CỘT ẢNH (BÊN PHẢI) */}
                          <Col xs={24} md={14}>
                            <motion.div 
                              initial={{ opacity: 0, scale: 1.2 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              style={{ position: 'relative', overflow: 'hidden' }}
                            >
                              <img 
                                src={roomImage} 
                                alt={room.name} 
                                style={{ width: '100%', height: isMobile ? '350px' : '650px', objectFit: 'cover' }} 
                              />
                            </motion.div>
                          </Col>
                        </Row>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              )}
            </div>
          </motion.div>
        </div>

        {/* === SCENE 2: DỊCH VỤ ĐẲNG CẤP (MẪU 2: ĐEN SANG TRỌNG) === */}
        <div id="scene-2" style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
          {/* Custom style for Luxury Flat Swiper */}
          <style>{`
            .scene2-flat-swiper {
              padding: 10px 0 30px 0 !important;
              overflow: visible !important;
            }
            .scene2-flat-swiper .swiper-slide {
              height: auto !important;
            }
            .scene2-flat-card {
              position: relative;
              cursor: pointer;
              transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .scene2-flat-card:hover {
              transform: translateY(-8px);
            }
            .scene2-flat-card:hover img {
              transform: scale(1.06);
            }
            .scene2-flat-card:hover .service-explore-link {
              color: #fff !important;
              text-decoration-color: #fff !important;
            }
          `}</style>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants} style={{ position: "relative", padding: isMobile ? "100px 20px 60px" : "120px 40px 60px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 50, padding: isMobile ? "0" : "0 40px" }}>
              <div style={{ textAlign: 'left', maxWidth: '650px' }}>
                <Text style={{ color: COLORS.gold, textTransform: "uppercase", letterSpacing: "4px", fontSize: 12, fontWeight: 600 }}>TIỆN ÍCH</Text>
                <Title level={2} style={{ margin: "10px 0 0", fontSize: isMobile ? 32 : 56, color: '#fff', fontFamily: "'Noto Serif', serif", fontWeight: 400 }}>
                  Dịch Vụ <i style={{ fontWeight: 300 }}>Đẳng Cấp</i>
                </Title>
                <Paragraph style={{ color: COLORS.gray, fontSize: 16, marginTop: 15, lineHeight: 1.6 }}>
                  Trải nghiệm dịch vụ 5 sao với đầy đủ tiện nghi hiện đại, phục vụ mọi nhu cầu của bạn
                </Paragraph>
              </div>
              
              {!isMobile && (
                <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                  <Button className="service-prev-btn" ghost style={{ width: 48, height: 48, borderRadius: 0, borderColor: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} icon={<ArrowLeftOutlined />} />
                  <Button className="service-next-btn" ghost style={{ width: 48, height: 48, borderRadius: 0, borderColor: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} icon={<ArrowRightOutlined />} />
                </div>
              )}
            </div>

            <div style={{ width: '100%', padding: isMobile ? "0" : "0 40px" }}>
              {loadingServices ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Text style={{ color: COLORS.gold }}>Đang tải dịch vụ...</Text>
                </div>
              ) : (() => {
                const combinedSlides = [
                  ...servicesData.map(s => ({ ...s, isService: true })),
                  ...tienIchPosts.map(p => ({ ...p, isPost: true }))
                ];

                return (
                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={30}
                    slidesPerView={isMobile ? 1.2 : 4}
                    loop={combinedSlides.length > 4}
                    autoplay={{
                      delay: 4000,
                      disableOnInteraction: false,
                    }}
                    navigation={{
                      prevEl: '.service-prev-btn',
                      nextEl: '.service-next-btn',
                    }}
                    className="scene2-flat-swiper"
                    style={{ overflow: 'visible' }}
                  >
                    {combinedSlides.map((item, index) => {
                      const img = item.isPost ? (item.imageUrl || getCategoryImageUrl(item.title)) : getCategoryImageUrl(item.name);
                      const icon = item.isPost ? getCategoryIcon(item.categoryName || "") : getCategoryIcon(item.name);
                      const title = item.isPost ? item.title : item.name;
                      const description = item.isPost ? item.excerpt : item.description;
                      const targetUrl = item.isPost ? `/news/${item.id}` : `/news`;

                      return (
                        <SwiperSlide key={item.isPost ? `post-${item.id}` : `service-${item.id}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="scene2-flat-card"
                            style={{ textAlign: 'left' }}
                            onClick={() => navigate(targetUrl)}
                          >
                            <div style={{ position: 'relative', marginBottom: 20, overflow: 'hidden', borderRadius: 4, aspectRatio: '3/4', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                              <img 
                                src={img} 
                                alt={title} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover', 
                                  transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)' 
                                }} 
                              />
                              
                              {/* Square Icon Overlay exactly like the user's screenshot */}
                              <div style={{ 
                                position: 'absolute', 
                                top: 15, 
                                left: 15, 
                                width: 42, 
                                height: 42, 
                                background: 'rgba(255,255,255,0.08)', 
                                backdropFilter: 'blur(5px)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                border: '1px solid rgba(255,255,255,0.15)' 
                              }}>
                                {icon}
                              </div>

                              {/* Blog tag if it's a post */}
                              {item.isPost && (
                                <Tag color="gold" style={{ position: 'absolute', top: 15, right: 15, borderRadius: 2, border: 'none', fontWeight: 600, padding: '2px 8px' }}>
                                  BÀI VIẾT
                                </Tag>
                              )}

                              {/* Bottom Gradient overlay */}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', pointerEvents: 'none' }} />
                            </div>

                            <Title level={3} style={{ color: '#fff', fontSize: 20, fontFamily: "'Noto Serif', serif", marginBottom: 12, marginTop: 0, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {title}
                            </Title>
                            
                            <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 18, height: 42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {description || "Trải nghiệm không gian thư giãn tuyệt vời với dịch vụ chuẩn quốc tế."}
                            </Paragraph>
                            
                            <span 
                              className="service-explore-link"
                              style={{ 
                                color: COLORS.gold, 
                                fontSize: 11, 
                                fontWeight: 'bold', 
                                letterSpacing: '2px', 
                                textDecoration: 'underline', 
                                textUnderlineOffset: '6px',
                                cursor: 'pointer',
                                display: 'inline-block',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              KHÁM PHÁ THÊM
                            </span>
                          </motion.div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                );
              })()}
            </div>
          </motion.div>
        </div>

        {/* === SCENE 3: KHÁM PHÁ (MẪU ĐỒNG BỘ 3 TRÌNH BÀY) === */}
        <div id="scene-3" style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
          
          {/* Custom style for Attractions Section */}
          <style>{`
            .attr-sidebar-list {
              display: flex;
              flex-direction: column;
              gap: 0;
              max-height: 460px;
              overflow-y: auto;
              scrollbar-width: none; /* Firefox */
            }
            .attr-sidebar-list::-webkit-scrollbar {
              display: none; /* Safari and Chrome */
            }
            .attr-sidebar-item {
              display: flex;
              align-items: center;
              padding: 18px 20px;
              cursor: pointer;
              border-bottom: 1px solid rgba(255,255,255,0.06);
              transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
              position: relative;
              text-align: left;
            }
            .attr-sidebar-item::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: #c19b4a;
              transform: scaleY(0);
              transform-origin: bottom;
              transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .attr-sidebar-item.active {
              background: rgba(193, 155, 74, 0.03);
            }
            .attr-sidebar-item.active::before {
              transform: scaleY(1);
            }
            
            .attr-thumbnail-row {
              display: flex;
              gap: 15px;
              overflow-x: auto;
              padding: 10px 0;
              scrollbar-width: none; /* Firefox */
            }
            .attr-thumbnail-row::-webkit-scrollbar {
              display: none; /* Safari and Chrome */
            }
            .attr-thumbnail-item {
              position: relative;
              width: 140px;
              height: 90px;
              border-radius: 4px;
              overflow: hidden;
              cursor: pointer;
              transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
              flex-shrink: 0;
              border: 2px solid transparent;
            }
            .attr-thumbnail-item.active {
              border-color: #c19b4a;
            }
            .attr-thumbnail-item:hover {
              transform: translateY(-4px);
            }
            .attr-thumbnail-item:hover img {
              transform: scale(1.08);
            }
            
            .attr-btn-nav {
              width: 40px;
              height: 40px;
              border-radius: 0;
              border-color: rgba(255,255,255,0.15) !important;
              color: #fff !important;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s;
              background: rgba(10,10,10,0.5) !important;
              backdrop-filter: blur(5px);
            }
            .attr-btn-nav:hover {
              border-color: #c19b4a !important;
              color: #c19b4a !important;
            }
          `}</style>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants} style={{ position: "relative", padding: isMobile ? "100px 20px 60px" : "120px 80px 60px" }}>
            
            {/* Header Block matching the screenshot */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: 50, gap: 20 }}>
              <div style={{ textAlign: 'left' }}>
                <Text style={{ color: COLORS.gold, textTransform: "uppercase", letterSpacing: "4px", fontSize: 12, fontWeight: 600 }}>—— KHÁM PHÁ ——</Text>
                <Title level={2} style={{ margin: "10px 0 0", fontSize: isMobile ? 32 : 56, color: '#fff', fontFamily: "'Noto Serif', serif", fontWeight: 400, lineHeight: 1.15 }}>
                  Điểm Đến<br />
                  <span style={{ color: COLORS.gold, fontFamily: "'Noto Serif', serif", fontStyle: 'italic', fontWeight: 300 }}>Xung Quanh</span>
                </Title>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'right', maxWidth: '420px' }}>
                <Paragraph style={{ color: COLORS.gray, fontSize: 15, lineHeight: 1.6, marginBottom: 10 }}>
                  Khám phá những địa điểm tuyệt vời ngay gần khách sạn, từ di sản văn hóa đến thiên nhiên hoang sơ.
                </Paragraph>
                <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: 700, letterSpacing: '2px' }}>6 ĐỊA ĐIỂM NỔI BẬT</Text>
              </div>
            </div>

            {loadingAttractions ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Text style={{ color: COLORS.gold }}>Đang tải địa điểm du lịch...</Text>
              </div>
            ) : (() => {
              const fallbackAttractions = [
                { id: 1, name: "Bà Nà Hills", distanceKm: 25, address: "Hòa Vang, Đà Nẵng", description: "Khu du lịch nổi tiếng với Cầu Vàng", mapEmbedLink: "" },
                { id: 2, name: "Cầu Rồng", distanceKm: 3, address: "Sơn Trà, Đà Nẵng", description: "Cầu phun lửa và nước vào cuối tuần", mapEmbedLink: "" },
                { id: 3, name: "Bãi Biển Mỹ Khê", distanceKm: 5, address: "Ngũ Hành Sơn, Đà Nẵng", description: "Một trong sáu bãi biển quyến rũ nhất hành tinh", mapEmbedLink: "" },
                { id: 4, name: "Ngũ Hành Sơn", distanceKm: 8, address: "Ngũ Hành Sơn, Đà Nẵng", description: "Danh thắng tâm linh kỳ vĩ", mapEmbedLink: "" },
                { id: 5, name: "Hội An Phố Cổ", distanceKm: 30, address: "Hội An, Quảng Nam", description: "Di sản văn hóa thế giới cổ kính", mapEmbedLink: "" },
                { id: 6, name: "Bán Đảo Sơn Trà", distanceKm: 10, address: "Sơn Trà, Đà Nẵng", description: "Lá phổi xanh của thành phố Đà Nẵng", mapEmbedLink: "" }
              ];

              const items = attractionsData && attractionsData.length > 0 ? attractionsData : fallbackAttractions;
              const activeIndex = activeAttrIndex % items.length;
              const activeItem = items[activeIndex];
              const activeImg = activeItem.imageUrl || getAttractionImage(activeItem.name, activeIndex);

              const handleNext = () => {
                setActiveAttrIndex((prev) => (prev + 1) % items.length);
              };

              const handlePrev = () => {
                setActiveAttrIndex((prev) => (prev - 1 + items.length) % items.length);
              };

              return (
                <Row gutter={[40, 40]}>
                  
                  {/* Left Sidebar Menu (Hidden on mobile) */}
                  {!isMobile && (
                    <Col xs={0} lg={6}>
                      <div className="attr-sidebar-list" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        {items.map((item, idx) => {
                          const isActive = idx === activeIndex;
                          const formattedNum = String(idx + 1).padStart(2, '0');
                          return (
                            <div 
                              key={item.id} 
                              className={`attr-sidebar-item ${isActive ? 'active' : ''}`}
                              onClick={() => setActiveAttrIndex(idx)}
                            >
                              <div style={{ display: 'flex', alignItems: 'baseline', width: '100%' }}>
                                <Text style={{ 
                                  color: isActive ? COLORS.gold : 'rgba(255,255,255,0.2)', 
                                  fontSize: 24, 
                                  fontFamily: "'Noto Serif', serif", 
                                  fontWeight: 600, 
                                  marginRight: 20,
                                  transition: 'color 0.3s'
                                }}>
                                  {formattedNum}
                                </Text>
                                
                                <div style={{ flexGrow: 1 }}>
                                  <Text style={{ 
                                    color: isActive ? COLORS.gold : 'rgba(255,255,255,0.3)', 
                                    fontSize: 10, 
                                    fontWeight: 700, 
                                    letterSpacing: '1px', 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    marginBottom: 3
                                  }}>
                                    <EnvironmentOutlined style={{ marginRight: 4, color: COLORS.gold, fontSize: 10 }} /> {item.distanceKm ? `${item.distanceKm} KM` : 'LÂN CẬN'}
                                  </Text>
                                  <Text style={{ 
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', 
                                    fontSize: 16, 
                                    fontFamily: "'Noto Serif', serif", 
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'color 0.3s'
                                  }}>
                                    {item.name}
                                  </Text>
                                </div>

                                {isActive && (
                                  <ArrowRightOutlined style={{ color: COLORS.gold, fontSize: 16 }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Col>
                  )}

                  {/* Right Active Attraction Area */}
                  <Col xs={24} lg={18}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                      
                      {/* Big Showcase Banner */}
                      <div style={{ 
                        position: 'relative', 
                        width: '100%', 
                        height: isMobile ? '350px' : '460px', 
                        overflow: 'hidden', 
                        borderRadius: 4, 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)' 
                      }}>
                        
                        {/* Background Image with Ken Burns zoom effect */}
                        <motion.img 
                          key={activeImg}
                          initial={{ scale: 1.05, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          src={activeImg} 
                          alt={activeItem.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {/* Top Gradient */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%)', pointerEvents: 'none' }} />

                        {/* Left Edge Shadow Overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)', pointerEvents: 'none' }} />

                        {/* Bottom Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 80%)', pointerEvents: 'none' }} />

                        {/* Overlaid Next/Prev buttons at top right of the banner */}
                        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10, zIndex: 10 }}>
                          <Button className="attr-btn-nav" onClick={handlePrev} icon={<ArrowLeftOutlined />} />
                          <Button className="attr-btn-nav" onClick={handleNext} icon={<ArrowRightOutlined />} />
                        </div>

                        {/* Vertical Dots pagination at the far right edge */}
                        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
                          {items.map((_, idx) => {
                            const isDotActive = idx === activeIndex;
                            return (
                              <div 
                                key={idx}
                                onClick={() => setActiveAttrIndex(idx)}
                                style={{ 
                                  width: isDotActive ? 3 : 3, 
                                  height: isDotActive ? 30 : 6, 
                                  background: isDotActive ? COLORS.gold : 'rgba(255,255,255,0.2)', 
                                  borderRadius: 2, 
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Banner Central Text Content Overlay */}
                        <div style={{ position: 'absolute', bottom: 35, left: isMobile ? 20 : 50, right: 60, textAlign: 'left', zIndex: 10 }}>
                          <Text style={{ 
                            color: COLORS.gold, 
                            fontSize: 11, 
                            fontWeight: 700, 
                            letterSpacing: '3px',
                            display: 'block',
                            marginBottom: 8
                          }}>
                            —— {activeItem.distanceKm ? `${activeItem.distanceKm} KM TỪ KHÁCH SẠN` : 'LÂN CẬN KHÁCH SẠN'} ——
                          </Text>
                          
                          <Title level={1} style={{ 
                            color: '#fff', 
                            fontSize: isMobile ? 32 : 56, 
                            fontFamily: "'Noto Serif', serif", 
                            fontWeight: 400,
                            margin: '0 0 10px 0',
                            lineHeight: 1.1
                          }}>
                            {activeItem.name}
                          </Title>
                          
                          <Paragraph style={{ 
                            color: 'rgba(255,255,255,0.6)', 
                            fontSize: isMobile ? 13 : 15, 
                            lineHeight: 1.6, 
                            marginBottom: 25,
                            maxWidth: '550px'
                          }}>
                            {activeItem.description || "Khám phá địa điểm du lịch độc đáo và nổi tiếng gần khách sạn của chúng tôi."}
                          </Paragraph>
                          
                          <Button 
                            onClick={() => {
                              setSelectedAttraction(activeItem);
                              setIsMapModalOpen(true);
                            }}
                            style={{ 
                              background: COLORS.gold, 
                              borderColor: COLORS.gold, 
                              color: COLORS.dark, 
                              fontWeight: 700, 
                              fontSize: 12,
                              letterSpacing: '2px',
                              borderRadius: 2, 
                              height: 46, 
                              padding: '0 30px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 10,
                              boxShadow: '0 5px 15px rgba(193,155,74,0.3)',
                              transition: 'all 0.3s'
                            }}
                          >
                            KHÁM PHÁ NGAY <ArrowRightOutlined style={{ fontSize: 11 }} />
                          </Button>
                        </div>
                      </div>

                      {/* Bottom Mini Thumbnails Row */}
                      <div className="attr-thumbnail-row">
                        {items.map((item, idx) => {
                          const isActive = idx === activeIndex;
                          const thumbImg = getAttractionImage(item.name, idx);
                          return (
                            <div 
                              key={`thumb-${item.id}`}
                              className={`attr-thumbnail-item ${isActive ? 'active' : ''}`}
                              onClick={() => setActiveAttrIndex(idx)}
                            >
                              <img 
                                src={thumbImg} 
                                alt={item.name} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  transition: 'transform 0.4s ease'
                                }} 
                              />
                              
                              {/* Dark overlay */}
                              <div style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: isActive ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.5)', 
                                transition: 'all 0.3s'
                              }} />
                              
                              {/* Title Overlay */}
                              <div style={{ 
                                position: 'absolute', 
                                bottom: 8, 
                                left: 8, 
                                right: 8, 
                                textAlign: 'center',
                                zIndex: 5
                              }}>
                                <Text style={{ 
                                  color: '#fff', 
                                  fontSize: 10, 
                                  fontWeight: 700, 
                                  letterSpacing: '1px', 
                                  textTransform: 'uppercase',
                                  display: 'block',
                                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                }}>
                                  {item.name}
                                </Text>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </Col>

                </Row>
              );
            })()}

          </motion.div>
        </div>

        {/* === SCENE 4: TIN TỨC & CẢM HỨNG (MẪU 3: TRẮNG THANH LỊCH) === */}
        <div id="scene-4" style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants} style={{ position: "relative", padding: isMobile ? "120px 20px 60px" : "120px 80px 60px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60 }}>
              <div style={{ textAlign: 'left' }}>
                <Text style={{ color: COLORS.gray, textTransform: "uppercase", letterSpacing: "3px", fontSize: 12, fontWeight: 600 }}>CÂU CHUYỆN</Text>
                <Title level={2} style={{ margin: "10px 0 0 0", fontSize: isMobile ? 32 : 56, color: COLORS.dark, fontFamily: "'Noto Serif', serif", fontWeight: 400 }}>
                  Tin Tức & <i style={{ fontWeight: 300 }}>Cảm Hứng</i>
                </Title>
              </div>
              <Button type="link" onClick={() => navigate('/news')} style={{ color: COLORS.gray, fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>TẤT CẢ BÀI VIẾT</Button>
            </div>

            {loadingNews ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Text style={{ color: COLORS.gold }}>Đang tải tin tức...</Text>
              </div>
            ) : (
              <Row gutter={[60, 40]}>
                {/* TIN CHÍNH BÊN TRÁI (COL 16) */}
                <Col xs={24} lg={16}>
                  {newsData[0] && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.5 }}
                      style={{ textAlign: 'left', cursor: 'pointer' }} 
                      onClick={() => navigate('/news')}
                    >
                      <div style={{ overflow: 'hidden', marginBottom: 30 }}>
                        <motion.img 
                          initial={{ scale: 1.2 }}
                          whileInView={{ scale: 1 }}
                          transition={{ duration: 1.5 }}
                          src={newsData[0].imageUrl || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop"} 
                          alt={newsData[0].title} 
                          style={{ width: '100%', height: '500px', objectFit: 'cover' }} 
                        />
                      </div>
                      <Text style={{ color: COLORS.gold, textTransform: "uppercase", letterSpacing: "2px", fontSize: 12, fontWeight: 700 }}>DU LỊCH</Text>
                      <Title level={2} style={{ fontFamily: "'Noto Serif', serif", color: COLORS.dark, margin: '15px 0', fontSize: 32, fontWeight: 400 }}>{newsData[0].title}</Title>
                      <Paragraph style={{ color: COLORS.gray, fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
                        {stripMarkdown(newsData[0].content)?.substring(0, 200) || "Khám phá những điểm đến tuyệt vời nhất tại thành phố đáng sống..."}...
                      </Paragraph>
                      <Space size={20} style={{ color: COLORS.gray, fontSize: 13 }}>
                        <span>Nguyễn Văn A</span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span>5 phút đọc</span>
                      </Space>
                    </motion.div>
                  )}
                </Col>

                {/* TIN PHỤ & NEWSLETTER BÊN PHẢI (COL 8) */}
                <Col xs={24} lg={8}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {/* Danh sách tin phụ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                      {newsData.slice(1, 4).map((article, idx) => (
                        <div key={article.id} style={{ display: 'flex', gap: 20, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/news')}>
                          <img src={article.imageUrl || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=200&auto=format&fit=crop"} alt={article.title} style={{ width: 100, height: 70, objectFit: 'cover' }} />
                          <div style={{ textAlign: 'left' }}>
                            <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{idx === 0 ? 'MẸO HAY' : idx === 1 ? 'ẨM THỰC' : 'DỊCH VỤ'}</Text>
                            <Title level={5} style={{ margin: '5px 0', color: COLORS.dark, fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>{article.title}</Title>
                            <Text style={{ color: COLORS.gray, fontSize: 11 }}>4 phút đọc</Text>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Newsletter Signup */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 40, textAlign: 'left' }}>
                      <Text style={{ color: COLORS.gray, textTransform: "uppercase", letterSpacing: "2px", fontSize: 10, fontWeight: 700 }}>NEWSLETTER</Text>
                      <Paragraph style={{ color: COLORS.dark, fontSize: 14, margin: '15px 0' }}>Nhận ưu đãi đặc biệt và tin tức mới nhất từ IT Hotel</Paragraph>
                      <div style={{ position: 'relative', borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                        <input 
                          type="text" 
                          placeholder="Email của bạn" 
                          style={{ border: 'none', width: '100%', outline: 'none', fontSize: 14, background: 'transparent' }} 
                        />
                        <ArrowRightOutlined style={{ position: 'absolute', right: 0, bottom: 12, cursor: 'pointer', color: COLORS.dark }} />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </motion.div>
        </div>

        {/* === SCENE 5: FOOTER === */}
        <div id="scene-5" style={{ background: "#050505", position: "relative", width: "100%", padding: "80px 0 40px" }}>
          <div style={{ padding: isMobile ? "0 20px" : "0 80px" }}>
            <Row gutter={[40, 40]}>
              <Col xs={24} md={6}>
                <div>
                  <Title level={4} style={{ margin: "0 0 20px 0", color: '#fff', letterSpacing: '2px', fontFamily: "'Noto Serif', serif" }}>IT HOTEL</Title>
                  <Paragraph style={{ color: COLORS.gray, fontSize: 13 }}>Khách sạn 5 sao tại Đà Nẵng, mang đến trải nghiệm nghỉ dưỡng đẳng cấp thế giới.</Paragraph>
                </div>
              </Col>
              <Col xs={12} md={{ span: 4, offset: 2 }}>
                <div>
                  <Title level={5} style={{ color: COLORS.gray, fontSize: 12, marginBottom: 20, letterSpacing: '1px' }}>KHÁM PHÁ</Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Text style={{ color: '#fff', cursor: 'pointer' }} onClick={() => scrollToScene(0)}>Trang chủ</Text>
                    <Text style={{ color: '#fff', cursor: 'pointer' }} onClick={() => scrollToScene(1)}>Bộ sưu tập</Text>
                    <Text style={{ color: '#fff', cursor: 'pointer' }} onClick={() => scrollToScene(2)}>Tiện ích</Text>
                    <Text style={{ color: '#fff', cursor: 'pointer' }} onClick={() => scrollToScene(3)}>Khám phá</Text>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div>
                  <Title level={5} style={{ color: COLORS.gray, fontSize: 12, marginBottom: 20, letterSpacing: '1px' }}>DỊCH VỤ</Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Text style={{ color: '#fff', cursor: 'pointer' }}>Phòng & Suite</Text>
                    <Text style={{ color: '#fff', cursor: 'pointer' }}>Nhà hàng</Text>
                    <Text style={{ color: '#fff', cursor: 'pointer' }}>Spa & Wellness</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div>
                  <Title level={5} style={{ color: COLORS.gray, fontSize: 12, marginBottom: 20, letterSpacing: '1px' }}>LIÊN HỆ</Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Text style={{ color: '#fff' }}><EnvironmentOutlined style={{ marginRight: 10, color: COLORS.gold }} /> Sơn Trà, Đà Nẵng</Text>
                    <Text style={{ color: '#fff' }}><PhoneOutlined style={{ marginRight: 10, color: COLORS.gold }} /> +84 236 123 4567</Text>
                    <Text style={{ color: '#fff' }}><MailOutlined style={{ marginRight: 10, color: COLORS.gold }} /> info@ithotel.com</Text>
                  </div>
                </div>
              </Col>
            </Row>

            <div>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0 20px 0' }} />
              <Row justify="space-between" align="middle" style={{ color: COLORS.gray, fontSize: 13 }}>
                <Col>Khám phá vẻ đẹp bất tận cùng IT HOTEL. All rights reserved.</Col>
                <Col>
                  <Space size="large">
                    <Text style={{ color: COLORS.gray, cursor: 'pointer' }}>Privacy</Text>
                    <Text style={{ color: COLORS.gray, cursor: 'pointer' }}>Terms</Text>
                  </Space>
                </Col>
                <Col>
                  <Space size="middle">
                    <FacebookFilled style={{ fontSize: 16, cursor: 'pointer', color: '#fff' }} />
                    <InstagramFilled style={{ fontSize: 16, cursor: 'pointer', color: '#fff' }} />
                    <TwitterOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#fff' }} />
                  </Space>
                </Col>
              </Row>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL BẢN ĐỒ GOOGLE MAPS & CHI TIẾT ĐIỂM ĐẾN */}
      <Modal
        title={<div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif', serif", color: '#1f2937' }}>🗺️ {selectedAttraction?.name}</div>}
        open={isMapModalOpen}
        onCancel={() => setIsMapModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsMapModalOpen(false)} style={{ borderRadius: 12, background: COLORS.gold, borderColor: COLORS.gold, color: COLORS.dark, fontWeight: 'bold', padding: '0 30px', height: 40 }}>
            Đóng Bản Đồ
          </Button>
        ]}
        width={800}
        style={{ top: 30 }}
        bodyStyle={{ padding: '20px 0' }}
      >
        {selectedAttraction && (
          <div style={{ padding: '0 24px', fontSize: 15, color: '#374151', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <Tag color="gold" style={{ fontSize: 14, fontWeight: 600, padding: '4px 12px', borderRadius: 12 }}>
                Khoảng cách: {selectedAttraction.distanceKm ? `${selectedAttraction.distanceKm} KM` : 'Lân cận'}
              </Tag>
              {selectedAttraction.address && (
                <Text style={{ color: '#4b5563', fontSize: 14 }}><EnvironmentOutlined /> {selectedAttraction.address}</Text>
              )}
            </div>
            <Paragraph style={{ fontSize: 16, lineHeight: 1.6, color: '#374151', marginBottom: 24 }}>
              {selectedAttraction.description}
            </Paragraph>
            <div style={{ width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb' }}>
              <iframe
                src={getMapEmbed(selectedAttraction)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={selectedAttraction.name}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MOBILE DRAWER MENU */}
      <Drawer
        title={<div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Noto Serif', serif", color: COLORS.gold }}>IT HOTEL</div>}
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        bodyStyle={{ background: COLORS.dark, padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
        headerStyle={{ background: COLORS.dark, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        closeIcon={<span style={{ color: '#fff', fontSize: 20 }}>✕</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {menuItems.map((item) => (
            <Text
              key={item.key}
              onClick={() => {
                setMobileMenuOpen(false);
                if (item.type === 'scroll') scrollToScene(item.key);
                else navigate(item.path);
              }}
              style={{ color: activeScene === item.key ? COLORS.gold : '#fff', fontSize: 18, fontWeight: 500, cursor: 'pointer' }}
            >
              {item.label}
            </Text>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default HomePage;

