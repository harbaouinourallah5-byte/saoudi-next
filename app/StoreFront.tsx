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
  
  // Chatbot State & Types
  interface ChatProductCard {
    _id: string;
    title: string;
    price: number;
    img: string;
    inStock?: boolean;
    category?: string;
    gender?: string;
  }

  interface ChatMessageItem {
    role: 'user' | 'ai';
    text: string;
    products?: ChatProductCard[];
    time?: string;
  }

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    { 
      role: 'ai', 
      text: "عسلامة وبك مرحبا في Saoudi Accessoires ! 👋✨\nكيفاش نجم نعاونك اليوم ؟ تلوج على منقالة رجالي، كولية، ولا كادو مزيان ؟ 😊",
      time: "À l'instant"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, isChatTyping, isChatOpen]);
  
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

  // Promo & Roulette State (Code raslen)
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: string; value: number; label: string } | null>(null);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasAlreadySpun, setHasAlreadySpun] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteResultModal, setRouletteResultModal] = useState<{ won: boolean; text: string; sub: string } | null>(null);

  // Order Success Modal State (in Tunisian Arabic)
  const [orderSuccessData, setOrderSuccessData] = useState<{
    show: boolean;
    name: string;
    phone: string;
    total: string;
    wilaya: string;
    delegation: string;
    rue: string;
  } | null>(null);

  // Sound generator for roulette (Web Audio API)
  const playRouletteSound = (type: 'tick' | 'win' | 'lost') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
        });
      } else if (type === 'lost') {
        [380, 290].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.25);
        });
      }
    } catch (e) {}
  };

  // 8 Slices exact definition: 4x 10%, 1x 15%, 2x Perdu, 1x Livraison gratuite
  const ROULETTE_SLICES = [
    { label: "-10%", full: "10% de réduction", type: "percent", value: 10, bg: "#D4AF37", text: "#000" },
    { label: "Perdu 😢", full: "Perdu (حظ أوفر)", type: "lost", value: 0, bg: "#374151", text: "#FFF" },
    { label: "-10%", full: "10% de réduction", type: "percent", value: 10, bg: "#F3BA2F", text: "#000" },
    { label: "Livraison 🚚", full: "Livraison Gratuite (0 DT)", type: "free_shipping", value: 8.5, bg: "#10B981", text: "#FFF" },
    { label: "-10%", full: "10% de réduction", type: "percent", value: 10, bg: "#D4AF37", text: "#000" },
    { label: "-15% 🌟", full: "15% de réduction !", type: "percent", value: 15, bg: "#8B5CF6", text: "#FFF" },
    { label: "-10%", full: "10% de réduction", type: "percent", value: 10, bg: "#F3BA2F", text: "#000" },
    { label: "Perdu 😢", full: "Perdu (حظ أوفر)", type: "lost", value: 0, bg: "#374151", text: "#FFF" },
  ];

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setRouletteResultModal(null);

    // Pick random target slice (0 to 7)
    const targetIndex = Math.floor(Math.random() * 8);
    const winningSlice = ROULETTE_SLICES[targetIndex];

    let ticks = 0;
    const tickInterval = setInterval(() => {
      playRouletteSound('tick');
      ticks++;
      if (ticks > 24) clearInterval(tickInterval);
    }, 160);

    const sliceAngle = 45;
    const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
    const spins = 360 * (5 + Math.floor(Math.random() * 2));
    const finalRot = rouletteRotation + spins + ((targetAngle - (rouletteRotation % 360) + 360) % 360);

    setRouletteRotation(finalRot);

    setTimeout(() => {
      setIsSpinning(false);
      clearInterval(tickInterval);

      if (typeof window !== "undefined") {
        localStorage.setItem("saoudi_raslen_already_spun", "true");
      }
      setHasAlreadySpun(true);

      if (winningSlice.type === 'lost') {
        playRouletteSound('lost');
        setRouletteResultModal({
          won: false,
          text: "Dommage ! حظ أوفر في المرة القادمة 😢",
          sub: "Le code saoudi_raslen a été utilisé, mais pas de chance cette fois-ci."
        });
      } else {
        playRouletteSound('win');
        const promoData = {
          code: 'saoudi_raslen',
          type: winningSlice.type,
          value: winningSlice.value,
          label: winningSlice.full
        };
        setAppliedPromo(promoData);
        if (typeof window !== "undefined") {
          localStorage.setItem("saoudi_applied_promo", JSON.stringify(promoData));
        }
        setRouletteResultModal({
          won: true,
          text: `🎉 مبروك عليك! ربحت : ${winningSlice.full}`,
          sub: "تم تفعيل الخصم مباشرة في سلة المشتريات متاعك !"
        });
      }
    }, 4500);
  };

  const handleApplyPromo = (codeToTest?: string) => {
    const raw = (codeToTest || promoInput).trim().toLowerCase();
    if (!raw) return;
    if (raw === 'saoudi_raslen') {
      setIsRouletteOpen(true);
      showToast("Code saoudi_raslen activé ! Tournez la roulette !", "success");
    } else {
      showToast("Code promo invalide.", "error");
    }
  };

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
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
    if (localStorage.getItem("saoudi_raslen_already_spun") === "true") {
      setHasAlreadySpun(true);
    }
    const sPromo = localStorage.getItem("saoudi_applied_promo");
    if (sPromo) {
      try { setAppliedPromo(JSON.parse(sPromo)); } catch(e) {}
    }
    if (sName) setFormName(sName);
    if (sPhone) setFormPhone(sPhone);
    const sEmail = localStorage.getItem("saoudi_email");
    if (sEmail) setFormEmail(sEmail);
    const sWhatsapp = localStorage.getItem("saoudi_whatsapp");
    if (sWhatsapp) setFormWhatsapp(sWhatsapp);
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
      const matchGender = genderFilter === "all" || p.gender === genderFilter || !p.gender || p.gender === "mixte";
      const matchSearch = p.title.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch && matchGender;
    });
    setFilteredProducts(newFiltered);
  }, [products, currentCategory, searchQuery, genderFilter]);

  useEffect(() => {
    if (typeof window !== "undefined" && products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get("product");
      if (productId) {
        const targetProduct = products.find(p => p._id === productId);
        if (targetProduct) {
          openModal(targetProduct);
        }
      }
    }
  }, [products]);



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
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("product", product._id);
      window.history.pushState({}, '', currentUrl.toString());
    }
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
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("product");
      window.history.pushState({}, '', currentUrl.toString());
    }
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

  const sendChatMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const textToSend = (directMessage || chatInput).trim();
    if (!textToSend || isChatTyping) return;

    setChatInput("");
    const userMsg: ChatMessageItem = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setIsChatTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newHistory.map(m => ({ role: m.role, text: m.text })),
          clientProducts: products.map(p => ({
            _id: p._id,
            title: p.title,
            price: p.price,
            img: p.img || (p.colors && p.colors[0] && (p.colors[0].image || p.colors[0].img)) || '',
            inStock: p.inStock !== false,
            category: p.category,
            gender: p.gender
          }))
        })
      });
      const data = await res.json();
      
      if (data && data.reply) {
        setChatMessages(prev => [
          ...prev, 
          { 
            role: 'ai', 
            text: data.reply,
            products: data.products || [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev, 
          { 
            role: 'ai', 
            text: "عسلامة! فريقنا حاضر لمعاونتك، تنجم تتواصل معنا مباشرة على الواتساب 55211908 216+ 💬",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error: any) {
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: "عسلامة! تنجم تتواصل معنا مباشرة على الواتساب 55211908 216+ 💬 أو تواصل تصفّح منتوجاتنا !",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const clearChat = () => {
    setChatMessages([
      { 
        role: 'ai', 
        text: "عسلامة وبك مرحبا في Saoudi Accessoires ! 👋✨\nكيفاش نجم نعاونك اليوم ؟ 😊",
        time: "À l'instant"
      }
    ]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  let cartDiscount = 0;
  if (appliedPromo?.type === 'percent') {
    cartDiscount = (cartSubtotal * appliedPromo.value) / 100;
  }
  const baseShipping = cart.length > 0 ? (cart.some(item => item.product.freeShipping) ? 0 : 8.5) : 0;
  const cartShipping = appliedPromo?.type === 'free_shipping' ? 0 : baseShipping;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

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
              email: formEmail,
              whatsapp: formWhatsapp, 
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
        // Order success popup
        setOrderSuccessData({
          show: true,
          name: formName,
          phone: formPhone,
          total: cartTotal.toFixed(1),
          wilaya: formWilaya,
          delegation: formDelegation,
          rue: formRue
        });
        // Clear cart after sending
        setCart([]);
        localStorage.removeItem("saoudi_cart");
        
        // Save form data so they don't have to type it again next time!
        localStorage.setItem("saoudi_name", formName);
        localStorage.setItem("saoudi_phone", formPhone);
        localStorage.setItem("saoudi_email", formEmail);
        localStorage.setItem("saoudi_whatsapp", formWhatsapp);
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
        <div dir="ltr" className="fixed bottom-24 left-4 sm:left-6 z-50 w-[350px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[82vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-gray-950 p-3 sm:p-3.5 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-gray-950 shadow-inner">
                <i className="fas fa-robot text-base"></i>
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight tracking-wide">Assistant Saoudi ✨</h3>
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-900 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>{lang === 'ar' ? 'متصل الآن' : 'En ligne'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <a 
                href="https://wa.me/21655211908" 
                target="_blank" 
                rel="noreferrer" 
                title="WhatsApp direct"
                className="w-7 h-7 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-gray-950 transition"
              >
                <i className="fab fa-whatsapp text-xs font-bold"></i>
              </a>
              <button 
                onClick={clearChat} 
                title="Nouvelle discussion"
                className="w-7 h-7 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-gray-950 transition"
              >
                <i className="fas fa-sync-alt text-xs"></i>
              </button>
              <button 
                onClick={() => setIsChatOpen(false)} 
                title="Fermer"
                className="w-7 h-7 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-gray-950 transition"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#FAF8F5] dark:bg-gray-900">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs flex-shrink-0 mr-2 mt-1 shadow-2xs border border-amber-300 dark:border-amber-700">
                    <i className="fas fa-robot"></i>
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div 
                    dir="auto" 
                    className={`p-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-950 rounded-br-xs shadow-sm font-medium' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-gray-700 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {msg.text}

                    {/* PRODUCT CARDS ATTACHED TO MESSAGE */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 space-y-2">
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fas fa-sparkles text-[10px]"></i>
                          <span>{lang === 'ar' ? 'المنتوجات المقترحة :' : 'Produits suggérés :'}</span>
                        </div>
                        <div className="space-y-2">
                          {msg.products.map((prod, pIdx) => {
                            const fullProd = products.find(
                              (p: any) => p._id === prod._id || (p.title && prod.title && p.title.toLowerCase().trim() === prod.title.toLowerCase().trim())
                            ) || prod;
                            const displayImg = prod.img || fullProd.img || (fullProd.colors && fullProd.colors[0]?.image) || '';
                            const isOutOfStock = prod.inStock === false || fullProd.inStock === false;

                            return (
                              <div
                                key={pIdx}
                                className="bg-gray-50/90 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 rounded-xl p-2 border border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-400 transition-all shadow-2xs flex items-center gap-2.5 group text-left"
                              >
                                {/* Product Thumbnail */}
                                <div
                                  onClick={() => fullProd && openModal(fullProd)}
                                  className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                                >
                                  {displayImg ? (
                                    <img
                                      src={displayImg}
                                      alt={prod.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <i className="fas fa-gem text-amber-500"></i>
                                    </div>
                                  )}
                                  {isOutOfStock && (
                                    <span className="absolute inset-0 bg-red-600/80 text-white text-[8px] font-bold flex items-center justify-center text-center">
                                      Épuisé
                                    </span>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h4
                                    onClick={() => fullProd && openModal(fullProd)}
                                    className="text-xs font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-amber-500 transition"
                                    title={prod.title}
                                  >
                                    {prod.title}
                                  </h4>
                                  <div className="text-amber-600 dark:text-amber-400 font-extrabold text-xs mt-0.5">
                                    {prod.price} DT
                                  </div>

                                  {/* Action Button */}
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => fullProd && openModal(fullProd)}
                                      className="text-[10px] bg-gray-900 hover:bg-amber-500 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-gray-950 font-bold px-2.5 py-0.5 rounded-full transition flex items-center gap-1 shadow-2xs"
                                    >
                                      <i className="fas fa-eye text-[9px]"></i>
                                      <span>{lang === 'ar' ? 'عرض التفاصيل' : 'Voir le produit'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.time && (
                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                  )}
                </div>
              </div>
            ))}

            {isChatTyping && (
              <div className="flex justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs flex-shrink-0 mr-2 shadow-2xs">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-sm flex space-x-1.5 items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-gray-800 border-t border-gray-200/70 dark:border-gray-700 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {[
              { label: "⌚ Montres homme", query: "وريني السوايع الرجالي الموجودة" },
              { label: "💎 Colliers & Packs", query: "وريني الكوليات والباكات المقترحة" },
              { label: "🎁 Idée Cadeau", query: "نحب فكرة كادو مزيانة" },
              { label: "🚚 Livraison", query: "بقداش التوصيل وقداش يقعد؟" },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendChatMessage(undefined, chip.query)}
                className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-1 font-medium hover:border-amber-400 hover:text-amber-500 dark:hover:text-amber-400 transition shadow-2xs whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={sendChatMessage} className="p-2.5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <input 
              type="text" 
              dir="auto"
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder={lang === 'ar' ? 'اسألني أي سؤال...' : 'Posez votre question...'} 
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isChatTyping} 
              className="bg-amber-500 hover:bg-amber-600 text-gray-950 w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-amber-500 shadow-sm"
            >
              <i className="fas fa-paper-plane text-xs"></i>
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
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {/* PROMO / ROULETTE BOX */}
                  <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-2 border-gold/40 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-gold flex items-center gap-1.5 tracking-wider">
                        <i className="fas fa-gift text-sm text-yellow-500"></i> Code Spécial Raslen
                      </span>
                      {!appliedPromo && (
                        <span className="text-[10px] bg-gold text-gray-950 font-bold px-2 py-0.5 rounded-full animate-pulse">
                          Gagnez jusqu'à -15%
                        </span>
                      )}
                    </div>
                    {appliedPromo ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 rounded-lg p-2.5 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                          <i className="fas fa-check-circle text-emerald-500"></i>
                          {appliedPromo.label} appliqué !
                        </span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold px-2 py-0.5 rounded">
                          Verrouillé 🔒
                        </span>
                      </div>
                    ) : hasAlreadySpun ? (
                      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-center text-xs text-gray-500 dark:text-gray-400 font-bold">
                        Code saoudi_raslen déjà utilisé (1 seule chance par client) 🔒
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={promoInput} 
                          onChange={e => setPromoInput(e.target.value)}
                          placeholder="Code promo (ex: saoudi_raslen)" 
                          className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold text-gray-900 dark:text-white font-medium"
                        />
                        <button 
                          type="button"
                          onClick={() => handleApplyPromo()}
                          className="bg-gold hover:bg-yellow-500 text-gray-950 text-xs font-black px-3.5 py-2 rounded-lg transition shadow flex items-center gap-1 whitespace-nowrap"
                        >
                          <i className="fas fa-dice text-sm"></i> Tourner
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ULTRA VISIBLE CHECKOUT FORM */}
                  <div className="bg-amber-50/70 dark:bg-gray-900/90 border-2 border-gold/70 rounded-2xl p-4 shadow-lg mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-gold text-gray-950 flex items-center justify-center font-black text-xs">📝</span>
                      <h3 className="font-black text-gray-900 dark:text-white text-base">
                        Informations de livraison
                      </h3>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-4" dir="rtl">
                      عمر معلوماتك لهنا باش تجيك السلعة لباب الدار 👇
                    </p>

                    {/* Étape 1 : Coordonnées */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-gray-900 text-gold flex items-center justify-center text-[10px]">1</span>
                          Coordonnées
                        </span>
                        <span className="text-[11px] text-gray-500 font-bold" dir="rtl">معلومات الاتصال</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 mb-1">
                            Nom et Prénom <span className="text-red-500 font-bold">*</span> <span className="text-gray-400 font-normal">(الاسم واللقب)</span>
                          </label>
                          <div className="relative">
                            <i className="fas fa-user absolute left-3 top-3.5 text-gray-400 text-xs"></i>
                            <input 
                              type="text" 
                              required 
                              value={formName} 
                              onChange={e => setFormName(e.target.value)} 
                              placeholder="Ex: Mohamed Ben Ali" 
                              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-gold pl-8 pr-3 py-2.5 rounded-lg text-sm outline-none text-gray-900 dark:text-white font-medium shadow-sm transition" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 mb-1">
                            Numéro de Téléphone <span className="text-red-500 font-bold">*</span> <span className="text-gray-400 font-normal">(رقم الهاتف)</span>
                          </label>
                          <div className="relative">
                            <i className="fas fa-phone-alt absolute left-3 top-3.5 text-gray-400 text-xs"></i>
                            <input 
                              type="tel" 
                              required 
                              value={formPhone} 
                              onChange={e => setFormPhone(e.target.value)} 
                              placeholder="Ex: 98 123 456 / 22 345 678" 
                              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-gold pl-8 pr-3 py-2.5 rounded-lg text-sm outline-none text-gray-900 dark:text-white font-medium shadow-sm transition" 
                            />
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1" dir="rtl">
                            ⚠️ باش نكلموك في التليفون للتأكيد قبل ما نبعثو الكولي
                          </p>
                        </div>

                        {/* Optional Contacts */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Email (Optionnel)</label>
                            <input 
                              type="email" 
                              value={formEmail} 
                              onChange={e => setFormEmail(e.target.value)} 
                              placeholder="votre@email.com" 
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-gold p-2 rounded-lg text-xs outline-none text-gray-900 dark:text-white shadow-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">WhatsApp (Optionnel)</label>
                            <input 
                              type="tel" 
                              value={formWhatsapp} 
                              onChange={e => setFormWhatsapp(e.target.value)} 
                              placeholder="Numéro WhatsApp" 
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-gold p-2 rounded-lg text-xs outline-none text-gray-900 dark:text-white shadow-sm" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Étape 2 : Adresse de livraison */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-gray-900 text-gold flex items-center justify-center text-[10px]">2</span>
                          Adresse de livraison
                        </span>
                        <span className="text-[11px] text-gray-500 font-bold" dir="rtl">عنوان التوصيل</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 mb-1">
                              Gouvernorat <span className="text-red-500 font-bold">*</span> (الولاية)
                            </label>
                            <select 
                              value={formWilaya} 
                              onChange={e => { setFormWilaya(e.target.value); setFormDelegation(""); }} 
                              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-gold p-2.5 rounded-lg text-xs outline-none text-gray-900 dark:text-white font-bold shadow-sm"
                            >
                              <option value="">Sélectionnez la wilaya</option>
                              {Object.keys(tunisiaData).sort().map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 mb-1">
                              Délégation <span className="text-red-500 font-bold">*</span> (المعتمدية)
                            </label>
                            <select 
                              value={formDelegation} 
                              onChange={e => setFormDelegation(e.target.value)} 
                              disabled={!formWilaya} 
                              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-gold p-2.5 rounded-lg text-xs outline-none text-gray-900 dark:text-white font-bold disabled:opacity-40 shadow-sm"
                            >
                              <option value="">{formWilaya ? "Sélectionnez délégation" : "Choisissez la wilaya d'abord"}</option>
                              {formWilaya && tunisiaData[formWilaya].sort().map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 mb-1">
                            Adresse exacte <span className="text-red-500 font-bold">*</span> (العنوان بالتفصيل)
                          </label>
                          <div className="relative">
                            <i className="fas fa-home absolute left-3 top-3.5 text-gray-400 text-xs"></i>
                            <input 
                              type="text" 
                              value={formRue} 
                              onChange={e => setFormRue(e.target.value)} 
                              placeholder="Ex: Rue, Cité, N° maison, à côté de..." 
                              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-gold pl-8 pr-3 py-2.5 rounded-lg text-xs outline-none text-gray-900 dark:text-white font-medium shadow-sm transition" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Remarque pour le livreur (Optionnel)
                          </label>
                          <textarea 
                            value={formNotes} 
                            onChange={e => setFormNotes(e.target.value)} 
                            placeholder="Ex: Appelez avant d'arriver..." 
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-gold p-2 rounded-lg text-xs outline-none text-gray-900 dark:text-white h-14 resize-none shadow-sm"
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Reassurance Badges */}
                    <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-gray-700/60 grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        <i className="fas fa-truck text-emerald-500 text-xs"></i>
                        <span>Livraison 24-48h</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        <i className="fas fa-money-bill-wave text-amber-500 text-xs"></i>
                        <span>Paiement à la livraison</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t-2 border-gold/40 shadow-inner">
                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t.subtotal}</span>
                    <span className="font-bold">{cartSubtotal.toFixed(1)} {t.currency}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-tag"></i> Remise ({appliedPromo?.label})
                      </span>
                      <span>-{cartDiscount.toFixed(1)} {t.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t.shipping_cost}</span>
                    <span className={cartShipping === 0 ? "text-emerald-500 font-bold" : ""}>
                      {cartShipping === 0 ? "Gratuite (0 DT) 🚚" : `8.5 ${t.currency}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>{t.total} :</span>
                    <span className="text-gold text-xl">{cartTotal.toFixed(1)} {t.currency}</span>
                  </div>
                </div>

                <button 
                  onClick={submitCartOrder} 
                  disabled={isSubmittingOrder}
                  className="w-full bg-gradient-to-r from-yellow-500 via-gold to-yellow-600 hover:brightness-110 active:scale-[0.99] text-gray-950 font-black py-4 px-4 rounded-xl transition-all shadow-xl flex flex-col justify-center items-center uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed border-2 border-yellow-300"
                >
                  <div className="flex items-center gap-2 text-sm sm:text-base font-black">
                    {isSubmittingOrder ? (
                      <i className="fas fa-spinner fa-spin text-lg"></i>
                    ) : (
                      <i className="fas fa-check-circle text-lg"></i>
                    )}
                    <span>{isSubmittingOrder ? 'Traitement de la commande...' : `CONFIRMER LA COMMANDE • ${cartTotal.toFixed(1)} DT`}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-900/80 normal-case mt-0.5" dir="rtl">
                    أكّد الطلبية (الدفع كاش عند الاستلام)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROULETTE DE LA CHANCE MODAL */}
      {isRouletteOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative border-2 border-gold text-center overflow-hidden">
            <button 
              onClick={() => !isSpinning && setIsRouletteOpen(false)} 
              disabled={isSpinning}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-xl disabled:opacity-30"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="inline-block bg-gold/20 text-gold font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2">
              🎁 Code Spécial Raslen
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-1">
              Roulette de la Chance ! 🎰
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Tournez la roue pour tenter de gagner jusqu'à 15% de réduction ou la livraison gratuite !
            </p>

            {/* The Wheel */}
            <div className="relative w-72 h-72 mx-auto my-4 flex items-center justify-center">
              {/* Top Pointer */}
              <div className="absolute -top-3 z-30 text-red-500 text-3xl filter drop-shadow">
                <i className="fas fa-caret-down"></i>
              </div>

              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gold shadow-2xl pointer-events-none z-20"></div>

              {/* Rotating SVG Wheel */}
              <div 
                className="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${rouletteRotation}deg)`,
                  transitionDuration: isSpinning ? '4.5s' : '0s',
                  transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.2, 1)'
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {ROULETTE_SLICES.map((slice, i) => {
                    const startAngle = (i * 45 * Math.PI) / 180;
                    const endAngle = ((i + 1) * 45 * Math.PI) / 180;
                    const x1 = 50 + 50 * Math.cos(startAngle);
                    const y1 = 50 + 50 * Math.sin(startAngle);
                    const x2 = 50 + 50 * Math.cos(endAngle);
                    const y2 = 50 + 50 * Math.sin(endAngle);
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                    const midAngle = ((i + 0.5) * 45);

                    return (
                      <g key={i}>
                        <path d={pathData} fill={slice.bg} stroke="#ffffff" strokeWidth="0.5" />
                        <g transform={`rotate(${midAngle} 50 50)`}>
                          <text
                            x="78"
                            y="51"
                            fill={slice.text}
                            fontSize="4.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            transform="rotate(90 78 51)"
                          >
                            {slice.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Hub Button */}
              <button
                onClick={spinRoulette}
                disabled={isSpinning || !!appliedPromo || hasAlreadySpun}
                className="absolute z-20 w-16 h-16 rounded-full bg-gray-900 border-4 border-gold text-gold font-black text-xs uppercase flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition disabled:opacity-80"
              >
                {isSpinning ? (
                  <i className="fas fa-spinner fa-spin text-lg"></i>
                ) : appliedPromo ? (
                  "✓ FAIT"
                ) : (
                  "SPIN 🎰"
                )}
              </button>
            </div>

            {/* Spin Button below */}
            <button
              onClick={spinRoulette}
              disabled={isSpinning || !!appliedPromo || hasAlreadySpun}
              className="w-full mt-2 bg-gradient-to-r from-yellow-500 via-gold to-yellow-600 text-gray-950 font-black py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition uppercase tracking-wider text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSpinning ? "La roulette tourne..." : appliedPromo ? `Code Appliqué : ${appliedPromo.label}` : "TOURNER LA ROULETTE ! 🎰"}
            </button>

            {/* Result popup if won/lost */}
            {rouletteResultModal && (
              <div className="mt-4 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 animate-fade-in">
                <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">{rouletteResultModal.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{rouletteResultModal.sub}</p>
                <button 
                  onClick={() => { setRouletteResultModal(null); setIsRouletteOpen(false); }}
                  className="mt-2 text-xs font-bold text-gold underline hover:opacity-80"
                >
                  Fermer et voir mon panier
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOC CONFIRMATION COMMANDE EN ARABE TUNISIEN */}
      {orderSuccessData?.show && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 text-center relative border-2 border-gold/50 animate-scale-up">
            {/* Celebration Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 text-green-500 flex items-center justify-center text-4xl shadow-inner border border-green-200 dark:border-green-700 animate-bounce">
              <i className="fas fa-check-circle"></i>
            </div>

            {/* Main Title in Tunisian Arabic */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2" dir="rtl">
              مبروك عليك! تم تسجيل طلبيتك بنجاح 🎉
            </h2>
            <p className="text-gold font-bold text-base mb-6" dir="rtl">
              يعطيك الصحة على ثقتك في Saoudi Accessoires! 💎
            </p>

            {/* Instructions Box */}
            <div className="bg-amber-50/70 dark:bg-gray-900/60 rounded-xl p-4 mb-6 border border-amber-200 dark:border-gray-700 text-right space-y-3" dir="rtl">
              <div className="flex items-start space-x-3 space-x-reverse text-sm text-gray-800 dark:text-gray-200">
                <span className="text-lg">📞</span>
                <p><strong>باش نكلموك بالتليفون :</strong> في أقرب وقت لتأكيد الطلبية وتفاصيل التوصيل.</p>
              </div>
              <div className="flex items-start space-x-3 space-x-reverse text-sm text-gray-800 dark:text-gray-200">
                <span className="text-lg">🚚</span>
                <p><strong>التوصيل لباب دارك :</strong> في ظرف 24 إلى 48 ساعة أينما كنت في تونس.</p>
              </div>
              <div className="flex items-start space-x-3 space-x-reverse text-sm text-gray-800 dark:text-gray-200">
                <span className="text-lg">💵</span>
                <p><strong>الدفع عند الاستلام :</strong> تخلّص كاش بعد ما تتفقّد سلعتك وتتأكّد منها.</p>
              </div>
            </div>

            {/* Order Summary details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300 mb-6 flex justify-between items-center border border-gray-200 dark:border-gray-600">
              <div className="text-left">
                <p><strong>Client:</strong> {orderSuccessData.name}</p>
                <p><strong>Tél:</strong> {orderSuccessData.phone}</p>
                <p><strong>Ville:</strong> {orderSuccessData.delegation}, {orderSuccessData.wilaya}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 dark:text-gray-400 block">Total à payer:</span>
                <span className="text-xl font-bold text-gold">{orderSuccessData.total} DT</span>
              </div>
            </div>

            {/* Continue shopping button */}
            <button
              onClick={() => setOrderSuccessData(null)}
              className="w-full bg-gradient-to-r from-yellow-500 via-gold to-yellow-600 hover:brightness-110 active:scale-[0.99] text-gray-950 font-black py-4 px-6 rounded-xl transition shadow-xl text-base uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <i className="fas fa-shopping-bag"></i>
              <span>واصل التسوّق / Continuer mes achats</span>
            </button>
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

