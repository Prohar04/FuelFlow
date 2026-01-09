import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Fuel,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Database,
  Bell,
  Calendar,
} from "lucide-react";
import api from "../services/api";
import Button from "../components/ui/Button";
import "./LandingPage.css";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Animated section wrapper
function AnimatedSection({ children, className = "", variants = fadeInUp }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial='hidden'
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.section>
  );
}

// Features data
const features = [
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Secure multi-level authentication with Admin, Manager, Cashier, and Employee roles.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Comprehensive dashboards with live sales tracking and performance metrics.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description:
      "Complete employee scheduling, attendance tracking, and payroll management.",
  },
  {
    icon: Clock,
    title: "Shift Management",
    description:
      "Flexible shift templates with conflict detection and automated scheduling.",
  },
  {
    icon: Database,
    title: "Inventory Control",
    description:
      "Smart inventory tracking with automated reorder alerts and supplier management.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Real-time alerts for low stock, shift changes, and important updates.",
  },
];

// Carousel slides
const carouselSlides = [
  {
    title: "Complete Station Management",
    subtitle: "All-in-one solution for modern gas stations",
    description:
      "Streamline your operations with our comprehensive management platform. From fuel sales to employee scheduling, we've got you covered.",
    icon: Fuel,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    title: "Smart Analytics Dashboard",
    subtitle: "Data-driven decisions at your fingertips",
    description:
      "Track sales trends, monitor pump performance, and analyze revenue patterns with beautiful, intuitive charts and reports.",
    icon: BarChart3,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    title: "Efficient Team Management",
    subtitle: "Empower your workforce",
    description:
      "Manage shifts, track attendance, process payroll, and keep your team organized with our powerful HR tools.",
    icon: Users,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    title: "Secure & Reliable",
    subtitle: "Enterprise-grade security",
    description:
      "Rest easy with role-based access control, audit logs, and secure data handling for all your station operations.",
    icon: Shield,
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
];

// Stats data
const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "50+", label: "Features" },
  { value: "24/7", label: "Monitoring" },
  { value: "100%", label: "Secure" },
];

export default function LandingPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrices();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const fetchPrices = async () => {
    try {
      const response = await api.get("/prices/current");
      if (response.data.success) {
        setPrices(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide(
      (prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length
    );
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
  };

  return (
    <div className='landing-page'>
      {/* Navigation */}
      <motion.nav
        className='landing-nav'
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className='container'>
          <div className='nav-content'>
            <motion.div
              className='nav-brand'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='nav-brand-icon'>
                <Fuel size={28} />
              </div>
              <span>FuelFlow</span>
            </motion.div>
            <div className='nav-links'>
              <a href='#features'>Features</a>
              <a href='#prices'>Prices</a>
              <a href='#about'>About</a>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/login")}
                rightIcon={<Zap size={16} />}
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <main className='landing-main'>
        {/* Hero Carousel */}
        <section className='hero-carousel'>
          <div className='carousel-container'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentSlide}
                className='carousel-slide'
                style={{ background: carouselSlides[currentSlide].gradient }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <div className='container'>
                  <div className='carousel-content'>
                    <motion.div
                      className='carousel-text'
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                    >
                      <span className='carousel-badge'>
                        <Zap size={14} /> Modern Solution
                      </span>
                      <h1>{carouselSlides[currentSlide].title}</h1>
                      <h2>{carouselSlides[currentSlide].subtitle}</h2>
                      <p>{carouselSlides[currentSlide].description}</p>
                      <div className='carousel-actions'>
                        <Button onClick={() => navigate("/login")} size='lg'>
                          Start Free Trial
                        </Button>
                        <Button
                          variant='ghost'
                          size='lg'
                          onClick={() =>
                            document
                              .getElementById("features")
                              .scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          Learn More
                        </Button>
                      </div>
                    </motion.div>
                    <motion.div
                      className='carousel-visual'
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.4,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                    >
                      <div className='carousel-icon-wrapper'>
                        {(() => {
                          const IconComponent =
                            carouselSlides[currentSlide].icon;
                          return <IconComponent size={120} />;
                        })()}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Controls */}
            <button
              className='carousel-btn carousel-btn-prev'
              onClick={prevSlide}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className='carousel-btn carousel-btn-next'
              onClick={nextSlide}
            >
              <ChevronRight size={24} />
            </button>

            {/* Carousel Indicators */}
            <div className='carousel-indicators'>
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${
                    index === currentSlide ? "active" : ""
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <AnimatedSection className='stats-section' variants={staggerContainer}>
          <div className='container'>
            <motion.div className='stats-grid' variants={staggerContainer}>
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className='stat-item'
                  variants={scaleIn}
                >
                  <span className='stat-value'>{stat.value}</span>
                  <span className='stat-label'>{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Prices Section */}
        <AnimatedSection
          className='prices-section'
          variants={fadeInUp}
          id='prices'
        >
          <div className='container'>
            <div className='section-header'>
              <motion.span className='section-badge' variants={scaleIn}>
                <TrendingUp size={16} /> Live Updates
              </motion.span>
              <h2>Current Fuel Prices</h2>
              <p>Real-time pricing updated automatically</p>
            </div>
            <motion.div
              className='prices-grid'
              variants={staggerContainer}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true }}
            >
              {loading ? (
                <div className='prices-loading'>
                  <div className='spinner'></div>
                  <span>Loading prices...</span>
                </div>
              ) : prices.length > 0 ? (
                prices.map((price, index) => (
                  <motion.div
                    key={price._id}
                    className='price-card'
                    variants={scaleIn}
                    whileHover={{
                      y: -10,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                      transition: { duration: 0.3 },
                    }}
                  >
                    <div className='price-card-header'>
                      <Fuel size={24} />
                    </div>
                    <div className='price-fuel-type'>{price.fuelType}</div>
                    <div className='price-amount'>
                      <span className='currency'>৳</span>
                      {price.unitPrice}
                      <span className='unit'>/L</span>
                    </div>
                    <div className='price-date'>
                      <Calendar size={14} />
                      Effective from{" "}
                      {new Date(price.effectiveFrom).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className='no-prices'>
                  <Fuel size={48} />
                  <p>No prices available</p>
                </div>
              )}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Features Section */}
        <AnimatedSection
          className='features-section'
          variants={fadeInUp}
          id='features'
        >
          <div className='container'>
            <div className='section-header'>
              <motion.span className='section-badge' variants={scaleIn}>
                <Zap size={16} /> Powerful Features
              </motion.span>
              <h2>Everything You Need</h2>
              <p>
                Comprehensive tools to manage every aspect of your gas station
              </p>
            </div>
            <motion.div
              className='features-grid'
              variants={staggerContainer}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: "-50px" }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className='feature-card'
                  variants={scaleIn}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 25px 50px rgba(102, 126, 234, 0.15)",
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className='feature-icon'>
                    <feature.icon size={28} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className='cta-section' variants={fadeInUp} id='about'>
          <div className='container'>
            <motion.div
              className='cta-content'
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className='cta-text'>
                <h2>Ready to Transform Your Station?</h2>
                <p>
                  Join hundreds of gas stations already using FuelFlow to
                  streamline their operations and boost productivity.
                </p>
              </div>
              <motion.div className='cta-actions' whileHover={{ scale: 1.02 }}>
                <Button size='lg' onClick={() => navigate("/login")}>
                  Get Started Now
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Footer */}
        <footer className='landing-footer'>
          <div className='container'>
            <div className='footer-content'>
              <div className='footer-brand'>
                <Fuel size={24} />
                <span>FuelFlow</span>
              </div>
              <p>© 2026 FuelFlow. Modern gas station management.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
