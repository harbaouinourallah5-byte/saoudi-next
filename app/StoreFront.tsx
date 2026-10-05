"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { tunisiaData } from "./data/tunisia";
import { translations, Language } from "./data/translations";

export default function StoreFront({ initialProducts = [], initialBoxes = [] }: { initialProducts?: any[], initialBoxes?: any[] }) {
  // State for products and boxes, initialized with server-rendered data
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [boxes, setBoxes] = useState<any[]>(initialBoxes);
  
  // App state
  const [loading, setLoading] = useState(true); // Restored for aesthetic preloader!
  const [gridLoading, setGridLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>('ar');

  const t = translations[lang];
  

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedBox, setSelectedBox] = useState({ price: 0, name: "Sans Boîte", img: "original" });
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [modalMainImg, setModalMainImg] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "profile">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [collapsedCartItems, setCollapsedCartItems] = useState<string[]>([]);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: "Bonjour ! 👋 Je suis l'assistant de Saoudi Accessoires. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWilaya, setFormWilaya] = useState("");
  const [formDelegation, setFormDelegation] = useState("");
  const [formRue, setFormRue] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{show: boolean, msg: string, type: "success"|"error"}>({show: false, msg: "", type: "success"});

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    // Purely aesthetic preloader timeout
    const forceTimer = setTimeout(() => {
        setLoading(false);
        // Force reveal immediately when preloader disappears
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
    }, 700); // 0.7 seconds of luxury branding

    const initApp = async () => {
      try {
        // ONLY fetch user session on client side
        const userRes = await fetch("/api/customer/me");
        if (userRes.ok) {
            const data = await userRes.json();
            if (data.user) {
                setUser(data.user);
                if (!localStorage.getItem("saoudi_name")) {
                    setFormName(data.user.name || "");
                    setFormPhone(data.user.phone || "");
                    setFormRue(data.user.address || "");
                }
            }
        }
      } catch (e) {
        console.error("Erreur de chargement.", e);
      }
    };
    
    // Load saved cart and user details
    const savedCart = localStorage.getItem("saoudi_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch(e) {}
    }
    const sName = localStorage.getItem("saoudi_name");
    const sPhone = localStorage.getItem("saoudi_phone");
    const sWilaya = localStorage.getItem("saoudi_wilaya");
    const sDelegation = localStorage.getItem("saoudi_delegation");
    const sRue = localStorage.getItem("saoudi_rue");
    if (sName) setFormName(sName);
    if (sPhone) setFormPhone(sPhone);
    if (sWilaya) setFormWilaya(sWilaya);
    if (sDelegation) setFormDelegation(sDelegation);
    if (sRue) setFormRue(sRue);

    initApp();
    return () => clearTimeout(forceTimer);

    const handleScroll = () => {
      const reveals = document.querySelectorAll(".reveal");
      for (let i = 0; i < reveals.length; i++) {
        if (reveals[i].getBoundingClientRect().top < window.innerHeight - 50) {
          reveals[i].classList.add("active");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: any) => {
    setSearchQuery(e.target.value.toLowerCase());
    triggerGridLoader();
  };

  const selectCategory = (cat: any) => {
    setCurrentCategory(cat);
    triggerGridLoader();
  };

  const triggerGridLoader = () => {
    setGridLoading(true);
    setTimeout(() => setGridLoading(false), 800);
  };

  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  useEffect(() => {
    const newFiltered = products.filter((p: any) => {
      const matchCat = currentCategory === "all" || p.category === currentCategory || (currentCategory === "Colliers_Bracelets" && (p.category === "Bracelets" || p.category === "Colliers"));
      const matchGender = genderFilter === "all" || p.gender === genderFilter || !p.gender;
      const matchSearch = p.title.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch && matchGender;
    });
    setFilteredProducts(newFiltered);
  }, [products, currentCategory, searchQuery, genderFilter]);



  // Product Modal Logic
  const openModal = (product: any) => {
    setSelectedProduct(product);
    setSelectedBox({ price: 0, name: "Sans Boîte", img: "original" });
    if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
        setModalMainImg(product.colors[0].image || product.img);
    } else {
        setSelectedColor(null);
        setModalMainImg(product.img);
    }
    setSelectedQuantity(1);
    setIsProductModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const carouselImages = useMemo(() => {
    if (!selectedProduct) return [];
    const imgs = [selectedProduct.img];
    if (selectedProduct.gallery) {
      imgs.push(...selectedProduct.gallery);
    }
    if (selectedProduct.colors) {
      selectedProduct.colors.forEach((c: any) => {
        if (c.image && !imgs.includes(c.image)) {
          imgs.push(c.image);
        }
      });
    }
    return imgs;
  }, [selectedProduct]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = carouselImages.indexOf(modalMainImg);
    const nextIndex = (currentIndex + 1) % carouselImages.length;
    setModalMainImg(carouselImages[nextIndex]);
    setSelectedBox({ ...selectedBox, img: "original" });
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = carouselImages.indexOf(modalMainImg);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = carouselImages.length - 1;
    setModalMainImg(carouselImages[prevIndex]);
    setSelectedBox({ ...selectedBox, img: "original" });
  };

  const closeModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    document.body.style.overflow = "auto";
  };

  const handleMouseMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  // Cart Logic
  const addToCart = () => {
    if (!selectedProduct) return;
    const newItem = {
      id: Math.random().toString(36).substring(7),
      product: selectedProduct,
      box: selectedBox,
      color: selectedColor,
      price: selectedProduct.price + selectedBox.price,
      qty: selectedQuantity
    };
    const newCart = [...cart, newItem];
    setCart(newCart);
    localStorage.setItem("saoudi_cart", JSON.stringify(newCart));
    
    showToast("Produit ajouté au panier avec succès !", "success");
    closeModal();
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem("saoudi_cart", JSON.stringify(newCart));
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatMessages, { role: 'user', text: userMessage }] })
      });
      const data = await res.json();
      
      if (res.ok && data.reply) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Désolé, problème: ${data.error || 'inconnu'} ${data.details ? JSON.stringify(data.details) : ''}` }]);
      }
    } catch (error: any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur fatale: ${error.message}` }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  const cartShipping = cart.length > 0 ? (cart.some(item => item.product.freeShipping) ? 0 : 8.5) : 0;
  const cartTotal = cartSubtotal + cartShipping;

  const submitCartOrder = async () => {
    if (cart.length === 0) return;
    if (!formName || !formPhone || !formWilaya || !formDelegation) {
      showToast("S'il vous plaît, remplissez vos informations de livraison.", "error");
      return;
    }

    setIsSubmittingOrder(true);
    
    // Format cart data for the API
    const cartData = cart.map((item) => ({
      title: item.product.title,
      price: item.price,
      qty: item.qty || 1,
      box: item.product.allowBoxes !== false ? item.box.name : "Sans Boîte",
      color: item.color ? item.color.name : null,
    }));

    const combinedAddress = `${formRue}, ${formDelegation}, ${formWilaya}`;

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: { 
            name: formName, 
            phone: formPhone, 
            address: combinedAddress,
            wilaya: formWilaya,
            delegation: formDelegation,
            rue: formRue,
            notes: formNotes
          },
          cart: cartData,
          total: cartTotal.toFixed(1),
          shipping: cartShipping
        }),
      });

      if (res.ok) {
        showToast("Votre commande a été confirmée avec succès !", "success");
        // Clear cart after sending
        setCart([]);
        localStorage.removeItem("saoudi_cart");
        
        // Save form data so they don't have to type it again next time!
        localStorage.setItem("saoudi_name", formName);
        localStorage.setItem("saoudi_phone", formPhone);
        localStorage.setItem("saoudi_wilaya", formWilaya);
        localStorage.setItem("saoudi_delegation", formDelegation);
        localStorage.setItem("saoudi_rue", formRue);
        
        setIsCartOpen(false);
      } else {
        const errorData = await res.json();
        showToast(`Erreur: ${JSON.stringify(errorData)}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Erreur de connexion au serveur.", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const res = await fetch("/api/customer/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          setFormName(data.user.name);
          setIsAuthModalOpen(false);
          showToast("Compte créé avec succès !", "success");
        } else {
          showToast(data.error, "error");
        }
      } else {
        const res = await fetch("/api/customer/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          if (data.user.name) setFormName(data.user.name);
          if (data.user.phone) setFormPhone(data.user.phone);
          if (data.user.address) setFormRue(data.user.address);
          setIsAuthModalOpen(false);
          showToast("Connexion réussie !", "success");
        } else {
          showToast(data.error, "error");
        }
      }
    } catch (err) {
      showToast("Une erreur s'est produite.", "error");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/customer/logout", { method: "POST" });
    setUser(null);
    setIsAuthModalOpen(false);
  };

  const categoryTitles: Record<string, string> = {
    all: t.cat_all,
    Montres: t.cat_montres,
    Couple: t.cat_couple,
    Colliers_Bracelets: t.cat_bracelets,
    Bagues: t.cat_bagues,
    Packs: t.cat_packs,
  };

  return (
    <div className={`relative scroll-smooth text-gray-900 bg-[#FDFBF7] dark:bg-gray-900 dark:text-gray-100 ${loading ? 'overflow-hidden' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* CUSTOM TOAST NOTIFICATION */}
      <div 
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} flex items-center space-x-3 px-6 py-3 rounded-full shadow-2xl ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#25D366] text-white'}`}
      >
        <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} text-lg`}></i>
        <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        body { font-family: 'Cairo', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
        h1, h2, h3, .brand-font { font-family: 'Tajawal', sans-serif; }
        .bg-gold { background-color: #D4AF37; }
        .text-gold { color: #D4AF37; }
        .border-gold { border-color: #D4AF37; }
        .hover-gold:hover { color: #D4AF37; }
        
        .dark .brand-glow {
            background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: none;
            font-weight: 700;
        }

        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.5, 0, 0, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }

        .wheel-bg {
            background: conic-gradient(
                #D4AF37 0 60deg, #111827 60deg 120deg, 
                #D4AF37 120deg 180deg, #111827 180deg 240deg, 
                #D4AF37 240deg 300deg, #111827 300deg 360deg
            );
        }

        @keyframes loader-slide {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .animate-loader { animation: loader-slide 1.5s ease-in-out infinite; }

        @keyframes slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
      `}} />

      {/* LUXURY PRELOADER (Restored for aesthetics) */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center transition-opacity duration-1000">
          <h2 className="text-5xl md:text-7xl brand-font tracking-widest mb-4 brand-glow animate-pulse">SAOUDI</h2>
          <div className="w-32 md:w-48 h-[1px] bg-gray-700 relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 h-full bg-gold w-1/3 animate-loader"></div>
          </div>
          <span className="text-gold text-xs md:text-sm uppercase tracking-[0.4em] font-light">- L'élégance qui te complète -</span>
        </div>
      )}





      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 transition-opacity"></div>
      )}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-2xl transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 z-50 flex flex-col`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/assets/logo.jpg" className="h-8 w-8 rounded-full border border-gold" alt="Logo" />
            <span className="text-xl font-bold brand-font tracking-widest text-gray-900 dark:brand-glow">SAOUDI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-red-500 dark:text-gray-300">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-4">
          <a href="#" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-home w-6 text-gold"></i> {t.home}</a>
          <a href="#boutique" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-gem w-6 text-gold"></i> {t.boutique}</a>
          <a href="#contact" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-phone w-6 text-gold"></i> {t.contact}</a>
          <a href="/admin" className="text-yellow-600 hover:text-yellow-700 uppercase tracking-wider text-sm flex items-center font-bold"><i className="fas fa-lock w-6"></i> {t.admin}</a>
        </nav>
        <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-700">
          <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2">
            <i className="fab fa-whatsapp"></i><span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-gray-900 dark:bg-black text-white text-xs py-2 text-center tracking-widest uppercase flex flex-col md:flex-row justify-center items-center md:space-x-6 transition-colors">
        <span><i className="fas fa-truck mr-2"></i> {t.shipping_banner}</span>
        <span className="hidden md:inline">|</span>
        <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="hover:text-green-400 transition mt-1 md:mt-0">
          <i className="fab fa-whatsapp mr-1 text-green-400"></i> WhatsApp: 55 211 908
        </a>
      </div>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm py-2 sticky top-0 z-30 transition-colors duration-300">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-800 dark:text-white text-2xl mr-2 focus:outline-none">
              <i className="fas fa-bars"></i>
            </button>
            <img src="/assets/logo.jpg" alt="Logo" className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-full shadow-sm" />
            <div className="flex flex-col justify-center">
              <span className="text-xl md:text-2xl font-bold brand-font tracking-widest text-gray-900 dark:brand-glow transition-colors">SAOUDI</span>
              <span className="text-[8px] md:text-[10px] text-gold tracking-[0.25em] uppercase text-center font-semibold">- Accessoires -</span>
            </div>
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">{t.home}</a>
            <a href="#boutique" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">{t.boutique}</a>
            <a href="#contact" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">{t.contact}</a>
            <a href="/admin" className="text-yellow-600 hover:text-yellow-700 transition uppercase text-sm tracking-wider font-bold"><i className="fas fa-lock"></i> {t.admin}</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1 shadow-inner">
              {(['ar', 'fr', 'en'] as Language[]).map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-xs font-bold px-2 py-1 rounded transition ${lang === l ? 'bg-white dark:bg-gray-600 text-gold shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={toggleTheme} className="text-gray-800 dark:text-gray-200 hover:text-gold transition text-xl" title="Changer le thème">
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button onClick={() => { setAuthMode(user ? "profile" : "login"); setIsAuthModalOpen(true); }} className="text-gray-800 dark:text-gray-200 hover:text-gold transition text-xl">
              <i className="fas fa-user-circle"></i>
            </button>
            <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="hidden sm:flex bg-[#25D366] text-white px-5 py-2 uppercase text-sm tracking-widest hover:bg-green-600 transition rounded-full shadow-md items-center gap-2">
              <i className="fab fa-whatsapp text-lg"></i>
              <span className="font-bold">{t.order_now}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* CINEMATIC VIDEO HERO */}
      <header className="w-full bg-[#1A1816] flex justify-center border-b border-gray-800 transition-colors reveal relative overflow-hidden h-[40vh] md:h-[60vh] lg:h-[80vh]">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover opacity-60">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-diamond-necklace-on-a-womans-neck-4162-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-0"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl brand-font text-white mb-4 tracking-widest uppercase brand-glow" style={{ textShadow: "2px 2px 20px rgba(0,0,0,0.9)" }}>
            La Collection Royale
          </h1>
          <p className="text-gray-300 text-sm md:text-lg tracking-widest uppercase mb-8" style={{ textShadow: "1px 1px 5px rgba(0,0,0,0.8)" }}>
            Brillez de mille feux.
          </p>
          <button onClick={() => document.getElementById("boutique")?.scrollIntoView({ behavior: "smooth" })} className="border-2 border-gold text-gold hover:bg-gold hover:text-gray-900 transition duration-300 px-8 py-3 rounded-full tracking-widest uppercase text-sm font-bold shadow-lg">
            Découvrir
          </button>
        </div>
      </header>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 py-6 border-b border-gray-100 dark:border-gray-700 shadow-sm transition-colors reveal">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-1 group cursor-pointer">
            <i className="fas fa-gem text-2xl text-gold group-hover:scale-110 transition duration-300"></i>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Qualité Premium</span>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 group cursor-pointer">
            <i className="fas fa-truck text-2xl text-gold group-hover:scale-110 transition duration-300"></i>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Livraison sur toute la Tunisie 🇹🇳</span>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 group cursor-pointer">
            <i className="fas fa-headset text-2xl text-gold group-hover:scale-110 transition duration-300"></i>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Service 7j/7</span>
          </div>
        </div>
      </div>

      {/* BOUTIQUE */}
      <section id="boutique" className="py-12 md:py-20 bg-[#FDFBF7] dark:bg-gray-900 transition-colors reveal">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* LEFT SIDEBAR */}
            <div className="w-full md:w-1/4 shrink-0">
              <div className="sticky top-28 bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative mb-8 text-gray-900">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={t.search}
                    className={`w-full border-b border-gray-300 dark:border-gray-600 focus:border-gold bg-transparent py-2 ${lang === 'ar' ? 'pr-8' : 'pl-8'} outline-none dark:text-white transition placeholder-gray-400 text-sm`}
                  />
                  <i className={`fas fa-search absolute ${lang === 'ar' ? 'right-1' : 'left-1'} top-3 text-gold`}></i>
                </div>
                <h3 className="brand-font text-lg md:text-xl mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 uppercase tracking-wider">
                  {t.categories}
                </h3>
                <ul className="space-y-4 font-light text-sm md:text-[13px] tracking-widest uppercase">
                  {[
                    { id: "all", label: t.cat_all },
                    { id: "Montres", label: t.cat_montres },
                    { id: "Colliers_Bracelets", label: t.cat_bracelets },
                    { id: "Bagues", label: t.cat_bagues },
                    { id: "Couple", label: t.cat_couple },
                    { id: "Packs", label: t.cat_packs },
                  ].map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => selectCategory(cat.id)}
                        className={`transition w-full text-left flex justify-between items-center group ${
                          currentCategory === cat.id ? "text-gold font-bold active" : "text-gray-800 dark:text-gray-400 hover:text-gold dark:hover:text-gold font-semibold"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <i className={`fas ${lang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'} text-xs transition ${currentCategory === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT GRID */}
            <div className="w-full md:w-3/4">
              <div className="mb-8 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-3">
                <h2 className="text-2xl md:text-3xl brand-font text-gray-900 dark:text-white">{categoryTitles[currentCategory as keyof typeof categoryTitles]}</h2>
                <span className="text-gray-500 text-xs tracking-widest uppercase">{filteredProducts.length} Produit{filteredProducts.length !== 1 ? "s" : ""}</span>
              </div>

              {/* GENDER FILTER */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {[
                  { id: "all", label: t.gender_all },
                  { id: "femme", label: t.gender_women },
                  { id: "homme", label: t.gender_men },
                  { id: "mixte", label: t.gender_unisex }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGenderFilter(g.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition border ${
                      genderFilter === g.id 
                        ? 'bg-gray-900 dark:bg-gold text-white dark:text-gray-900 border-gray-900 dark:border-gold' 
                        : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gold dark:hover:border-gold'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[400px]">
                {gridLoading && (
                  <div className="absolute inset-0 z-20 bg-[#FDFBF7]/80 dark:bg-gray-900/80 flex flex-col items-center justify-center pb-20">
                    <i className="fas fa-circle-notch fa-spin text-4xl text-gold mb-4"></i>
                    <span className="text-gray-600 dark:text-gray-400 tracking-widest uppercase text-xs font-bold">Chargement...</span>
                  </div>
                )}
                
                {filteredProducts.length === 0 && !gridLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center text-center py-20 text-gray-500">
                    <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                    <p>Aucun produit ne correspond à votre recherche.</p>
                  </div>
                ) : (
                  filteredProducts.map((p: any, idx: number) => {
                    const inStock = p.inStock !== false;
                    const freeShipping = p.freeShipping === true;
                    return (
                      <div key={idx} className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-sm overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col relative reveal active">
                        {inStock ? (
                          <div className="absolute top-3 left-3 z-10 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm border border-green-200">{t.in_stock}</div>
                        ) : (
                          <div className="absolute top-3 left-3 z-10 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm border border-red-200">{t.out_of_stock}</div>
                        )}
                        {p.gender && (
                          <div className="absolute top-10 left-3 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm border border-gray-200 dark:border-gray-600">
                            {p.gender === 'femme' ? t.gender_women : p.gender === 'homme' ? t.gender_men : t.gender_unisex}
                          </div>
                        )}
                        {freeShipping && (
                          <div className="absolute top-3 right-3 z-10 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-sm border border-blue-200"><i className="fas fa-truck"></i> {t.free}</div>
                        )}
                        <div
                          className="relative h-64 overflow-hidden cursor-pointer"
                          onClick={() => openModal(p)}
                        >
                          <img src={p.img} alt={p.title} className={`w-full h-full object-cover transition duration-500 ${inStock ? 'group-hover:scale-105' : 'grayscale opacity-60'}`} />
                          {inStock && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                <button className="bg-white text-gray-900 px-4 py-2 rounded-full flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg hover:bg-gold hover:text-white">
                                  <i className="fas fa-shopping-bag text-lg"></i>
                                  <span className="text-xs font-bold uppercase tracking-wider">{t.order_now}</span>
                                </button>
                            </div>
                          )}
                        </div>
                        <div className="p-6 text-center flex flex-col flex-grow">
                          <span className="text-[9px] text-gray-400 tracking-widest uppercase mb-1">{p.category || "Collection"}</span>
                          <h3 className={`text-lg md:text-xl brand-font mb-2 text-gray-900 dark:text-white ${!inStock ? "text-gray-400" : ""}`}>{p.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-light mb-4 flex-grow line-clamp-2">{p.desc}</p>
                          <div className={`font-bold text-xl brand-font mb-4 ${!inStock ? "text-gray-400 line-through" : "text-gold"}`}>{p.price} {t.currency}</div>
                          {!inStock && (
                            <div className="w-full bg-gray-400 text-white font-bold py-2 rounded-sm cursor-not-allowed uppercase tracking-wider text-xs">
                              {t.out_of_stock}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 dark:bg-black text-white py-12 md:py-16 transition-colors reveal">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <img src="/assets/logo.jpg" alt="Logo" className="h-16 w-16 object-cover rounded-full mb-4 border-2 border-gold" />
            <h2 className="text-3xl brand-font tracking-wider mb-2 brand-glow">SAOUDI</h2>
            <span className="text-[10px] text-gold tracking-[0.3em] uppercase block mb-4">- Accessoires -</span>
            <p className="text-gray-400 font-light text-sm italic">{t.footer_motto}</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg brand-font mb-6 text-gold uppercase tracking-wider">Suivez-nous</h3>
            <div className="flex flex-col space-y-4">
              <a href="https://instagram.com/saoudi_accessoire" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white transition flex items-center space-x-3">
                <i className="fab fa-instagram text-2xl text-pink-500"></i> <span>saoudi_accessoire</span>
              </a>
              <a href="https://www.facebook.com/share/1CPN55WbQQ/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white transition flex items-center space-x-3">
                <i className="fab fa-facebook text-2xl text-blue-500"></i> <span>Saoudi Accessoire</span>
              </a>
              <a href="https://www.tiktok.com/@saoudi_accessoire?_r=1&_t=ZS-9AEEyIs5DzW" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white transition flex items-center space-x-3">
                <i className="fab fa-tiktok text-2xl text-white"></i> <span>saoudi_accessoire</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg brand-font mb-6 text-gold uppercase tracking-wider">Contact & Infos</h3>
            <div className="flex flex-col space-y-4">
              <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#25D366] transition flex items-center space-x-3 group">
                <div className="bg-gray-800 p-2 rounded-full group-hover:bg-[#25D366] transition">
                  <i className="fab fa-whatsapp text-xl text-white"></i>
                </div>
                <span className="text-lg tracking-wider">55 211 908</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PRODUCT ORDER MODAL */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-2 sm:p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col md:flex-row relative transition-colors">
            <button onClick={closeModal} className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-500 dark:text-gray-300 hover:text-red-500 transition z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-sm">
              <i className="fas fa-times text-xl w-6 h-6 flex items-center justify-center"></i>
            </button>

            <div className="md:w-1/2 bg-[#FDFBF7] dark:bg-gray-900 flex flex-col p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700">
              <div
                className="flex-grow flex items-center justify-center relative overflow-hidden cursor-crosshair group mb-4"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {carouselImages.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage} 
                      onMouseMove={(e) => { e.stopPropagation(); setIsZooming(false); }}
                      onMouseEnter={() => setIsZooming(false)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 md:p-3 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-md z-20 transition-all"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      onClick={nextImage} 
                      onMouseMove={(e) => { e.stopPropagation(); setIsZooming(false); }}
                      onMouseEnter={() => setIsZooming(false)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 md:p-3 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-md z-20 transition-all"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
                <img
                  src={modalMainImg}
                  className="max-w-full h-auto max-h-[40vh] md:max-h-[60vh] rounded-sm shadow-sm object-contain transition-transform duration-200"
                  style={{
                    transformOrigin: isZooming ? `${mousePos.x}% ${mousePos.y}%` : "center center",
                    transform: isZooming ? "scale(2.2)" : "scale(1)",
                  }}
                  alt="Product"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <i className="fas fa-search-plus mr-1"></i> VIP Zoom
                </div>
              </div>

              {selectedProduct.gallery && selectedProduct.gallery.length > 0 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <div 
                    onClick={() => { setModalMainImg(selectedProduct.img); setSelectedBox({ ...selectedBox, img: "original" }); }}
                    className={`shrink-0 cursor-pointer border-2 rounded-sm p-1 transition ${modalMainImg === selectedProduct.img ? 'border-gold' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={selectedProduct.img} className="w-16 h-16 object-cover rounded-sm shadow-sm" alt="Thumbnail" />
                  </div>
                  {selectedProduct.gallery.map((gImg: string, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => { setModalMainImg(gImg); setSelectedBox({ ...selectedBox, img: "original" }); }}
                      className={`shrink-0 cursor-pointer border-2 rounded-sm p-1 transition ${modalMainImg === gImg ? 'border-gold' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={gImg} className="w-16 h-16 object-cover rounded-sm shadow-sm" alt={`Thumbnail ${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-4 md:p-8 flex flex-col">
              <div className="mb-4 md:mb-6">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-2xl md:text-3xl brand-font font-bold text-gray-900 dark:text-white leading-tight">{selectedProduct.title}</h2>
                  <div className="flex flex-col items-end gap-1">
                    {selectedProduct.inStock !== false ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest border border-green-200 whitespace-nowrap">{t.in_stock}</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest border border-red-200 whitespace-nowrap">{t.out_of_stock}</span>
                    )}
                    {selectedProduct.gender && (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                         {selectedProduct.gender === 'femme' ? t.gender_women : selectedProduct.gender === 'homme' ? t.gender_men : t.gender_unisex}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-4 font-light leading-relaxed">{selectedProduct.desc}</p>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl md:text-3xl font-bold text-gold brand-font">{selectedProduct.price.toFixed(1)} {t.currency}</div>
                  {selectedProduct.freeShipping && (
                    <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                      <i className="fas fa-truck mr-1"></i>{t.free_shipping}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700 mb-4 md:mb-6" />

              <form className="space-y-3 md:space-y-4 flex-grow">
                {selectedProduct.inStock !== false && selectedProduct.allowBoxes !== false && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">{t.box_choice}</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div
                        onClick={() => {
                            setSelectedBox({ price: 0, name: t.no_box, img: "original" });
                            setModalMainImg(selectedColor?.image || selectedProduct.img);
                        }}
                        className={`border-2 rounded-md p-1 md:p-2 text-center cursor-pointer transition ${selectedBox.img === "original" ? "border-gold bg-gray-700" : "border-gray-600 hover:border-gold"}`}
                      >
                        <i className={`fas fa-gem text-lg md:text-xl mb-1 block ${selectedBox.img === "original" ? "text-gold" : "text-gray-400 dark:text-gray-500"}`}></i>
                        <div className="text-[8px] md:text-[9px] font-bold uppercase leading-tight h-6 flex items-center justify-center dark:text-gray-200">{t.no_box}</div>
                        <div className={`text-[10px] md:text-xs font-bold ${selectedBox.img === "original" ? "text-gold" : "text-gray-400"}`}>+0 {t.currency}</div>
                      </div>
                      {(selectedProduct.boxes || []).map((b: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                              setSelectedBox({ price: b.price, name: b.name, img: b.img });
                              const comboKey = `${selectedColor?.name}---${b.name}`;
                              if (selectedColor && selectedProduct.combinations && selectedProduct.combinations[comboKey]) {
                                  setModalMainImg(selectedProduct.combinations[comboKey]);
                              } else {
                                  setModalMainImg(b.img);
                              }
                          }}
                          className={`border-2 rounded-md p-1 md:p-2 text-center cursor-pointer transition ${selectedBox.name === b.name && selectedBox.img !== "original" ? "border-gold bg-gray-700" : "border-gray-600 hover:border-gold"}`}
                        >
                          <img src={b.img} className="w-6 h-6 object-cover rounded-full mx-auto mb-1 border border-gray-200" alt="Box" />
                          <div className="text-[8px] md:text-[9px] font-bold uppercase leading-tight h-6 flex items-center justify-center dark:text-gray-200">{b.name}</div>
                          <div className={`text-[10px] md:text-xs font-bold ${selectedBox.name === b.name && selectedBox.img !== "original" ? "text-gold" : "text-gray-400"}`}>+{b.price} {t.currency}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">{t.color} ({selectedColor?.name || selectedProduct.colors[0].name})</label>
                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.colors.map((color: any, idx: number) => {
                        const isSelected = selectedColor?.name === color.name;
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedColor(color);
                              const comboKey = `${color.name}---${selectedBox.name}`;
                              if (selectedBox.img !== "original" && selectedProduct.combinations && selectedProduct.combinations[comboKey]) {
                                  setModalMainImg(selectedProduct.combinations[comboKey]);
                              } else if (color.image) {
                                  setModalMainImg(color.image);
                              } else {
                                  setModalMainImg(selectedProduct.img);
                              }
                            }}
                            className={`cursor-pointer rounded-full p-1 border-2 transition-all ${isSelected ? 'border-gold scale-110' : 'border-transparent hover:border-gray-300'}`}
                            title={`${color.name} - ${color.quantity > 0 ? 'En stock' : 'Rupture'}`}
                          >
                            <div 
                              className="w-8 h-8 rounded-full shadow-inner border border-gray-200 dark:border-gray-600"
                              style={{ backgroundColor: color.hex }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-sm border border-gray-200 dark:border-gray-600 mt-auto">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                    <span>{t.price} <span className="italic text-gray-400">{selectedProduct.allowBoxes !== false ? (selectedBox.price > 0 ? `(+ ${selectedBox.name})` : `(${t.no_box})`) : ""}</span></span>
                    <span className="font-semibold">{(selectedProduct.price + selectedBox.price).toFixed(1)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t.qty}</label>
                    <div className="flex items-center space-x-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                        <button type="button" onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gold transition font-bold text-lg">-</button>
                        <span className="font-bold w-6 text-center text-gray-900 dark:text-white">{selectedQuantity}</span>
                        <button type="button" onClick={() => setSelectedQuantity(selectedQuantity + 1)} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gold transition font-bold text-lg">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-3 mt-1">
                    <span>{t.item_total}</span>
                    <span className="text-gold">{((selectedProduct.price + selectedBox.price) * selectedQuantity).toFixed(1)} {t.currency}</span>
                  </div>
                </div>
                {selectedProduct.inStock !== false ? (
                  <button type="button" onClick={addToCart} className="w-full bg-gray-900 dark:bg-gold text-white dark:text-gray-900 font-bold py-3 rounded-sm hover:opacity-90 transition shadow-md flex justify-center items-center space-x-2 mt-4 uppercase tracking-wider text-sm">
                    <i className="fas fa-shopping-cart text-lg"></i><span>{t.add_to_cart}</span>
                  </button>
                ) : (
                  <div className="w-full bg-gray-400 text-white font-bold py-3 rounded-sm text-center uppercase tracking-wider text-sm mt-4 cursor-not-allowed">
                    {t.out_of_stock}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI CHATBOT UI */}
      {isChatOpen && (
        <div dir="ltr" className="fixed bottom-24 left-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-gold text-gray-900 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <i className="fas fa-robot text-xl"></i>
              <span className="font-bold">Assistant Saoudi</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-800 hover:text-black transition">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto h-80 space-y-3 bg-gray-50 dark:bg-gray-900">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div dir="auto" className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={sendChatMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <input 
              type="text" 
              dir="auto"
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Posez votre question..." 
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gold"
            />
            <button type="submit" disabled={!chatInput.trim() || isChatTyping} className="bg-gold text-gray-900 w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </form>
        </div>
      )}

      {/* FLOATING CHAT BUTTON */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 left-6 z-40 bg-white dark:bg-gray-800 text-gold p-4 rounded-full shadow-2xl hover:scale-110 transition-transform items-center justify-center flex border-2 border-gold"
        title="Discuter avec l'assistant"
      >
        <i className={`fas ${isChatOpen ? 'fa-times' : 'fa-comment-dots'} text-xl`}></i>
      </button>

      {/* FLOATING CART BUTTON */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gray-900 dark:bg-gold text-white dark:text-gray-900 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform items-center justify-center flex border-2 border-transparent dark:border-yellow-200"
        title="Panier"
      >
        <i className="fas fa-shopping-cart text-xl"></i>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            {cart.length}
          </span>
        )}
      </button>

      {/* CART SIDEBAR / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex justify-end transition-opacity">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right relative">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl brand-font font-bold flex items-center space-x-2">
                <i className="fas fa-shopping-cart text-gold"></i>
                <span>{t.cart}</span>
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <i className="fas fa-shopping-basket text-6xl text-gray-300 dark:text-gray-600"></i>
                  <p>{t.empty_cart}</p>
                  <button onClick={() => setIsCartOpen(false)} className="px-6 py-2 bg-gold text-gray-900 rounded-full font-bold text-sm uppercase">{t.continue_shopping}</button>
                </div>
              ) : (
                cart.map(item => {
                  const isCollapsed = collapsedCartItems.includes(item.id);
                  const toggleCollapse = () => {
                    setCollapsedCartItems(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
                  };
                  return (
                    <div key={item.id} className="border border-gray-100 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm overflow-hidden mb-3">
                      <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" onClick={toggleCollapse}>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex-1">{item.product.title}</h4>
                        <div className="flex items-center space-x-3">
                          <span className="text-gold font-bold">{(item.price * (item.qty || 1)).toFixed(1)} {t.currency}</span>
                          <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-gray-400 text-xs transition-transform`}></i>
                        </div>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="p-3 pt-0 flex space-x-4 border-t border-gray-50 dark:border-gray-700 mt-2 pt-3 relative bg-gray-50 dark:bg-gray-800/50">
                          <img src={item.color?.image || item.product.img} className="w-20 h-20 object-cover rounded-sm border border-gray-200" alt={item.product.title} />
                          <div className="flex-grow flex flex-col justify-center">
                            {item.color && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><div className="w-3 h-3 rounded-full border border-gray-300" style={{backgroundColor: item.color.hex}}></div> {item.color.name}</span>}
                            {item.product.allowBoxes !== false && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.box} {item.box.name}</span>}
                            <span className="text-gray-600 dark:text-gray-400 text-xs font-bold mt-1">{t.qty} {item.qty || 1}</span>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="absolute bottom-3 right-3 text-red-500 hover:text-white hover:bg-red-500 bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm border border-red-100" title="Supprimer cet article">
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {cart.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">{t.shipping_info}</h3>
                  <div className="space-y-3">
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder={t.fullname} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" />
                    <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder={t.phone} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" />
                    <select value={formWilaya} onChange={e => { setFormWilaya(e.target.value); setFormDelegation(""); }} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold text-gray-900 dark:text-white">
                      <option value="">{t.wilaya}</option>
                      {Object.keys(tunisiaData).sort().map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select value={formDelegation} onChange={e => setFormDelegation(e.target.value)} disabled={!formWilaya} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold disabled:opacity-50 text-gray-900 dark:text-white">
                      <option value="">{t.delegation}</option>
                      {formWilaya && tunisiaData[formWilaya].sort().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="text" value={formRue} onChange={e => setFormRue(e.target.value)} placeholder={t.rue} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" />
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.notes_label || "Notes additionnelles"}
                    </label>
                    <textarea 
                      value={formNotes} 
                      onChange={e => setFormNotes(e.target.value)} 
                      placeholder={t.notes_placeholder || "Écrivez vos notes..."} 
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold h-20 resize-none"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{t.subtotal}</span>
                  <span>{cartSubtotal.toFixed(1)} {t.currency}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{t.shipping_cost}</span>
                  <span className={cartShipping === 0 ? "text-green-500 font-bold" : ""}>{cartShipping === 0 ? t.free : `8.5 ${t.currency}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white mb-4 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>{t.total}</span>
                  <span className="text-gold">{cartTotal.toFixed(1)} {t.currency}</span>
                </div>
                
                <button 
                  onClick={submitCartOrder} 
                  disabled={isSubmittingOrder}
                  className="w-full bg-[#D4AF37] text-white font-bold py-3 rounded-md hover:bg-[#B38728] transition shadow-md flex justify-center items-center space-x-2 uppercase tracking-wider text-sm mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmittingOrder ? (
                    <i className="fas fa-spinner fa-spin text-lg"></i>
                  ) : (
                    <i className="fas fa-check-circle text-lg"></i>
                  )}
                  <span>{isSubmittingOrder ? '...' : `${t.checkout} (${cart.length})`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
              <i className="fas fa-times text-xl"></i>
            </button>
            
            {authMode === "profile" && user ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gold text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {user.name ? user.name.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                </div>
                <h2 className="text-2xl brand-font font-bold mb-1">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{user.email}</p>
                <div className="text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6 text-sm">
                  <p><strong>Téléphone :</strong> {user.phone || 'Non renseigné'}</p>
                  <p className="mt-2"><strong>Adresse :</strong> {user.address || 'Non renseignée'}</p>
                </div>
                <button onClick={handleLogout} className="w-full border-2 border-red-500 text-red-500 py-2 rounded-full font-bold hover:bg-red-500 hover:text-white transition">
                  Se déconnecter
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <h2 className="text-2xl brand-font font-bold mb-6 text-center text-gold">
                  {authMode === "login" ? "Connexion" : "Créer un compte"}
                </h2>
                
                {authMode === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nom Complet</label>
                    <input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded-md outline-none focus:border-gold" />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded-md outline-none focus:border-gold" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                  <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded-md outline-none focus:border-gold" />
                </div>
                
                <button type="submit" disabled={authLoading} className="w-full bg-gold text-gray-900 font-bold py-3 rounded-full hover:opacity-90 transition mt-4 disabled:opacity-50">
                  {authLoading ? "Patientez..." : (authMode === "login" ? "Se connecter" : "S'inscrire")}
                </button>
                
                <div className="text-center mt-4 text-sm text-gray-500">
                  {authMode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}
                  <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="text-gold font-bold ml-2 hover:underline">
                    {authMode === "login" ? "Créer un compte" : "Se connecter"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
