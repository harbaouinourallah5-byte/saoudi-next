"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

export default function Home() {
  // State for products and boxes
  const [products, setProducts] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  
  // App state
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Wheel of Fortune State
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [wheelEmail, setWheelEmail] = useState("");
  const [activeDiscount, setActiveDiscount] = useState<any>(null);
  const [wheelResultMsg, setWheelResultMsg] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<any>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedBox, setSelectedBox] = useState({ price: 0, name: "Sans Boîte", img: "original" });
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    // Hide preloader quickly so user isn't stuck waiting for massive DB fetches
    const forceTimer = setTimeout(() => {
        setLoading(false);
        // Force reveal immediately when preloader disappears
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
    }, 1500);

    const initApp = async () => {
      try {
        const boxRes = await fetch("/api/boxes");
        if (boxRes.ok) setBoxes(await boxRes.json());

        const prodRes = await fetch("/api/products");
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch (e) {
        console.error("Erreur de chargement.", e);
      } finally {
        setLoading(false);
        setTimeout(() => {
            document.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
        }, 100);
      }
      
      const storedDiscount = localStorage.getItem("saoudi_active_discount");
      if (storedDiscount) setActiveDiscount(JSON.parse(storedDiscount));
    };

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

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchCat = currentCategory === "all" || p.category === currentCategory;
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery) ||
        p.desc.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [products, currentCategory, searchQuery]);

  // Wheel Logic
  const wheelPrizes = [
    { label: "-10%", type: "percent", val: 10 },
    { label: "-5 DT", type: "fixed", val: 5 },
    { label: "Liv. Gratuite", type: "shipping", val: 0 },
    { label: "Perdu", type: "none", val: 0 },
    { label: "-15%", type: "percent", val: 15 },
    { label: "Cadeau", type: "gift", val: 0 },
  ];

  const spinWheel = () => {
    if (isSpinning) return;
    const emailInput = wheelEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput)) {
      alert("Veuillez entrer une adresse email complète et valide.");
      return;
    }
    const spunEmails = JSON.parse(localStorage.getItem("saoudi_spun_emails") || "[]");
    if (spunEmails.includes(emailInput)) {
      alert("Email déjà utilisé !");
      return;
    }

    setIsSpinning(true);
    spunEmails.push(emailInput);
    localStorage.setItem("saoudi_spun_emails", JSON.stringify(spunEmails));

    const randomSlice = Math.floor(Math.random() * 6);
    const totalRotation = 360 - randomSlice * 60 - 30 + 360 * 5;
    
    if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
    }

    setTimeout(() => {
      const won = wheelPrizes[randomSlice];
      if (won.type === "none") {
        setWheelResultMsg(<span className="text-red-500">Oh non ! Pas de chance cette fois. 😢</span>);
      } else {
        setWheelResultMsg(
          <span className="text-green-500">
            Félicitations !<br />
            Vous gagnez : <span className="text-gold text-3xl block mt-2">{won.label}</span>
          </span>
        );
        localStorage.setItem("saoudi_active_discount", JSON.stringify(won));
        setActiveDiscount(won);
      }
      setIsSpinning(false);
    }, 4000);
  };

  const closeWheelModal = () => {
    setIsWheelModalOpen(false);
  };

  // Product Modal Logic
  const openModal = (product) => {
    setSelectedProduct(product);
    setSelectedBox({ price: 0, name: "Sans Boîte", img: "original" });
    setIsProductModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    document.body.style.overflow = "auto";
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  // Order Calculation
  const subtotal = selectedProduct ? selectedProduct.price + selectedBox.price : 0;
  let shipping = selectedProduct && selectedProduct.freeShipping ? 0 : 8.5;
  let discountVal = 0;

  if (activeDiscount) {
    if (activeDiscount.type === "percent") discountVal = subtotal * (activeDiscount.val / 100);
    else if (activeDiscount.type === "fixed") discountVal = activeDiscount.val;
    else if (activeDiscount.type === "shipping") shipping = 0;
  }
  const total = Math.max(0, subtotal + shipping - discountVal);

  const submitOrder = () => {
    if (!activeDiscount && !sessionStorage.getItem("saoudi_wheel_prompted")) {
      sessionStorage.setItem("saoudi_wheel_prompted", "true");
      setIsWheelModalOpen(true);
      return;
    }
    
    if (!formName || !formPhone || !formAddress) {
      alert("S'il vous plaît, remplissez toutes vos informations.");
      return;
    }

    let promoMsg = "";
    if (activeDiscount) {
      promoMsg = `*Wheel Prize :* ${activeDiscount.label}%0A`;
    }

    let boxLine = selectedProduct?.allowBoxes !== false ? `%0A*Emballage:* ${selectedBox.name}` : "";
    let msg = `*🛍️ NOUVELLE COMMANDE* %0A%0A*Produit:* ${selectedProduct.title}${boxLine}%0A*Prix total (Articles):* ${subtotal.toFixed(
      1
    )} DT%0A*Livraison:* ${shipping === 0 ? "GRATUITE" : "8.5 DT"}%0A`;
    
    if (promoMsg) msg += promoMsg;
    
    msg += `*TOTAL À PAYER:* ${total.toFixed(
      1
    )} DT%0A%0A*📦 Informations Client:*%0A*Nom:* ${formName}%0A*Téléphone:* ${formPhone}%0A*Adresse:* ${formAddress}`;

    window.open(`https://wa.me/21655211908?text=${msg}`, "_blank");
    setTimeout(closeModal, 1000);
  };

  const categoryTitles = {
    all: "Toutes les collections",
    Montres: "Montres & Duo",
    Parures: "Parures",
    Bracelets: "Bracelets",
    Bagues: "Bagues",
    Packs: "Packs Cadeaux",
  };

  return (
    <div className={`relative scroll-smooth text-gray-900 bg-[#FDFBF7] dark:bg-gray-900 dark:text-gray-100 ${loading ? 'overflow-hidden' : ''}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        body { font-family: 'Lato', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
        h1, h2, h3, .brand-font { font-family: 'Playfair Display', serif; }
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
      `}} />

      {/* LUXURY PRELOADER */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center transition-opacity duration-1000">
          <h2 className="text-5xl md:text-7xl brand-font tracking-widest mb-4 brand-glow animate-pulse">SAOUDI</h2>
          <div className="w-32 md:w-48 h-[1px] bg-gray-700 relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 h-full bg-gold w-1/3 animate-loader"></div>
          </div>
          <span className="text-gold text-xs md:text-sm uppercase tracking-[0.4em] font-light">- L'élégance qui te complète -</span>
        </div>
      )}

      {/* FLOATING WHEEL BUTTON */}
      <button
        onClick={() => setIsWheelModalOpen(true)}
        className="fixed bottom-6 left-6 z-40 hidden dark:flex bg-gold text-gray-900 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform items-center justify-center animate-bounce border-2 border-yellow-200"
        title="Bonus !"
      >
        <i className="fas fa-gift text-2xl"></i>
      </button>

      {/* WHEEL OF FORTUNE MODAL */}
      {isWheelModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 md:p-8 text-center relative overflow-hidden border border-gold">
            <button onClick={closeWheelModal} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition z-10">
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-3xl brand-font text-gold mb-2">Un Cadeau Avant d'Acheter ?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Entrez votre adresse email complète pour tourner la roue. Une seule chance par client !
            </p>
            <div className="relative w-64 h-64 mx-auto mb-8 shadow-2xl rounded-full">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20 text-red-600 text-5xl filter drop-shadow-md">
                <i className="fas fa-caret-down"></i>
              </div>
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-gold wheel-bg relative overflow-hidden transition-transform duration-[4000ms] ease-out"
              >
                <div className="absolute w-full h-full flex justify-center text-gray-900 font-bold text-sm" style={{ transform: "rotate(30deg)" }}>
                  <span className="mt-4">-10%</span>
                </div>
                <div className="absolute w-full h-full flex justify-center text-white font-bold text-sm" style={{ transform: "rotate(90deg)" }}>
                  <span className="mt-4">-5 DT</span>
                </div>
                <div className="absolute w-full h-full flex justify-center text-gray-900 font-bold text-xs" style={{ transform: "rotate(150deg)" }}>
                  <span className="mt-4">Liv. 0 DT</span>
                </div>
                <div className="absolute w-full h-full flex justify-center text-white font-bold text-sm" style={{ transform: "rotate(210deg)" }}>
                  <span className="mt-4">Perdu</span>
                </div>
                <div className="absolute w-full h-full flex justify-center text-gray-900 font-bold text-sm" style={{ transform: "rotate(270deg)" }}>
                  <span className="mt-4">-15%</span>
                </div>
                <div className="absolute w-full h-full flex justify-center text-white font-bold text-sm" style={{ transform: "rotate(330deg)" }}>
                  <span className="mt-4">Cadeau</span>
                </div>
                <div className="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full z-10 border-2 border-gray-800 flex items-center justify-center font-bold text-gold text-lg brand-font shadow-inner">
                  SA
                </div>
              </div>
            </div>
            
            {!wheelResultMsg ? (
              <div>
                <input
                  type="email"
                  value={wheelEmail}
                  onChange={(e) => setWheelEmail(e.target.value)}
                  placeholder="Ex: nom@email.com"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white p-3 rounded-md mb-4 outline-none focus:border-gold transition"
                />
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="w-full bg-gray-900 dark:bg-gold text-white dark:text-gray-900 font-bold py-3 rounded-md hover:opacity-90 transition shadow-md uppercase tracking-wider text-sm disabled:opacity-50"
                >
                  {isSpinning ? "En cours..." : "Tourner la roue !"}
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <div className="text-xl font-bold mb-2">{wheelResultMsg}</div>
                <p className="text-sm text-gray-500">La remise sera automatiquement appliquée dans votre commande.</p>
                <button onClick={closeWheelModal} className="mt-4 bg-gold text-gray-900 px-8 py-3 rounded-full text-sm font-bold hover:opacity-90 transition uppercase">
                  Continuer
                </button>
              </div>
            )}
          </div>
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
          <a href="#" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-home w-6 text-gold"></i> Accueil</a>
          <a href="#boutique" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-gem w-6 text-gold"></i> Boutique</a>
          <a href="#contact" onClick={() => setIsSidebarOpen(false)} className="text-gray-800 dark:text-white hover:text-gold uppercase tracking-wider text-sm flex items-center"><i className="fas fa-phone w-6 text-gold"></i> Contact</a>
          <a href="/admin" className="text-yellow-600 hover:text-yellow-700 uppercase tracking-wider text-sm flex items-center font-bold"><i className="fas fa-lock w-6"></i> Admin</a>
        </nav>
        <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-700">
          <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2">
            <i className="fab fa-whatsapp"></i><span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-gray-900 dark:bg-black text-white text-xs py-2 text-center tracking-widest uppercase flex flex-col md:flex-row justify-center items-center md:space-x-6 transition-colors">
        <span><i className="fas fa-truck mr-2"></i> Livraison sur toute la Tunisie 🇹🇳 (8.5 DT)</span>
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

          <div className="hidden md:flex space-x-8 items-center">
            <a href="#" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">Accueil</a>
            <a href="#boutique" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">Boutique</a>
            <a href="#contact" className="text-gray-800 dark:text-gray-200 hover-gold transition uppercase text-sm tracking-wider font-semibold">Contact</a>
            <a href="/admin" className="text-yellow-600 hover:text-yellow-700 transition uppercase text-sm tracking-wider font-bold"><i className="fas fa-lock"></i> Admin</a>
          </div>

          <div className="flex items-center space-x-4">
            <a href="https://wa.me/21655211908" target="_blank" rel="noreferrer" className="hidden sm:flex bg-[#25D366] text-white px-5 py-2 uppercase text-sm tracking-widest hover:bg-green-600 transition rounded-full shadow-md items-center space-x-2">
              <i className="fab fa-whatsapp text-lg"></i>
              <span className="font-bold">Commander</span>
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
                    placeholder="Rechercher (Nom, Mot...)"
                    className="w-full border-b border-gray-300 dark:border-gray-600 focus:border-gold bg-transparent py-2 pl-8 outline-none dark:text-white transition placeholder-gray-400 text-sm"
                  />
                  <i className="fas fa-search absolute left-1 top-3 text-gold"></i>
                </div>
                <h3 className="brand-font text-lg md:text-xl mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 uppercase tracking-wider">
                  Catégories
                </h3>
                <ul className="space-y-4 font-light text-sm md:text-[13px] tracking-widest uppercase">
                  {[
                    { id: "all", label: "Toutes les collections" },
                    { id: "Montres", label: "Montres & Duo" },
                    { id: "Parures", label: "Parures" },
                    { id: "Bracelets", label: "Bracelets" },
                    { id: "Bagues", label: "Bagues" },
                    { id: "Packs", label: "Packs Cadeaux" },
                  ].map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => selectCategory(cat.id)}
                        className={`transition w-full text-left flex justify-between items-center group ${
                          currentCategory === cat.id ? "text-gold font-bold active" : "text-gray-500 dark:text-gray-400 hover:text-gold"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <i className={`fas fa-chevron-right text-xs transition ${currentCategory === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT GRID */}
            <div className="w-full md:w-3/4">
              <div className="mb-8 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-3">
                <h2 className="text-2xl md:text-3xl brand-font text-gray-900 dark:text-white">{categoryTitles[currentCategory]}</h2>
                <span className="text-gray-500 text-xs tracking-widest uppercase">{filteredProducts.length} Produit{filteredProducts.length !== 1 ? "s" : ""}</span>
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
                          <div className="absolute top-3 left-3 z-10 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm">En Stock</div>
                        ) : (
                          <div className="absolute top-3 left-3 z-10 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm">Épuisé</div>
                        )}
                        {freeShipping && (
                          <div className="absolute top-3 right-3 z-10 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-sm border border-blue-200"><i className="fas fa-truck"></i> Gratuit</div>
                        )}
                        <div
                          className={`relative h-64 overflow-hidden ${inStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          onClick={() => inStock && openModal(p)}
                        >
                          <img src={p.img} alt={p.title} className={`w-full h-full object-cover transition duration-500 ${inStock ? 'group-hover:scale-105' : 'grayscale opacity-60'}`} />
                          {inStock && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                <button className="bg-white text-gray-900 px-4 py-2 rounded-full flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg hover:bg-gold hover:text-white">
                                  <i className="fas fa-shopping-bag text-lg"></i>
                                  <span className="text-xs font-bold uppercase tracking-wider">Commander</span>
                                </button>
                            </div>
                          )}
                        </div>
                        <div className="p-6 text-center flex flex-col flex-grow">
                          <span className="text-[9px] text-gray-400 tracking-widest uppercase mb-1">{p.category || "Collection"}</span>
                          <h3 className={`text-lg md:text-xl brand-font mb-2 text-gray-900 dark:text-white ${!inStock ? "text-gray-400" : ""}`}>{p.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-light mb-4 flex-grow line-clamp-2">{p.desc}</p>
                          <div className={`font-bold text-xl brand-font mb-4 ${!inStock ? "text-gray-400 line-through" : "text-gold"}`}>{p.price} DT</div>
                          {!inStock && (
                            <div className="w-full bg-gray-400 text-white font-bold py-2 rounded-sm cursor-not-allowed uppercase tracking-wider text-xs">
                              Out of stock
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
            <p className="text-gray-400 font-light text-sm italic">"L'élégance qui te complète 🤍"</p>
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

            <div
              className="md:w-1/2 bg-[#FDFBF7] dark:bg-gray-900 flex items-center justify-center p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 relative overflow-hidden cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={selectedBox.img !== "original" ? selectedBox.img : selectedProduct.img}
                className="max-w-full h-auto max-h-[40vh] md:max-h-full rounded-sm shadow-sm object-contain transition-transform duration-200"
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

            <div className="md:w-1/2 p-4 md:p-8 flex flex-col">
              <div className="mb-4 md:mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl md:text-3xl brand-font font-bold text-gray-900 dark:text-white">{selectedProduct.title}</h2>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest border border-green-200">En Stock</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-4 font-light leading-relaxed">{selectedProduct.desc}</p>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl md:text-3xl font-bold text-gold brand-font">{selectedProduct.price.toFixed(1)} DT</div>
                  {selectedProduct.freeShipping && (
                    <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                      <i className="fas fa-truck mr-1"></i>Livraison Gratuite
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700 mb-4 md:mb-6" />

              <form className="space-y-3 md:space-y-4 flex-grow">
                {selectedProduct.allowBoxes !== false && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Choix d'emballage</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div
                        onClick={() => setSelectedBox({ price: 0, name: "Sans Boîte", img: "original" })}
                        className={`border-2 rounded-md p-1 md:p-2 text-center cursor-pointer transition ${selectedBox.price === 0 ? "border-gold bg-gray-700" : "border-gray-600 hover:border-gold"}`}
                      >
                        <i className={`fas fa-gem text-lg md:text-xl mb-1 block ${selectedBox.price === 0 ? "text-gold" : "text-gray-400 dark:text-gray-500"}`}></i>
                        <div className="text-[8px] md:text-[9px] font-bold uppercase leading-tight h-6 flex items-center justify-center dark:text-gray-200">Sans Boîte</div>
                        <div className={`text-[10px] md:text-xs font-bold ${selectedBox.price === 0 ? "text-gold" : "text-gray-400"}`}>+0 DT</div>
                      </div>
                      {(selectedProduct.boxes || []).map((b: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedBox({ price: b.price, name: b.name, img: b.img })}
                          className={`border-2 rounded-md p-1 md:p-2 text-center cursor-pointer transition ${selectedBox.price === b.price ? "border-gold bg-gray-700" : "border-gray-600 hover:border-gold"}`}
                        >
                          <img src={b.img} className="w-6 h-6 object-cover rounded-full mx-auto mb-1 border border-gray-200" alt="Box" />
                          <div className="text-[8px] md:text-[9px] font-bold uppercase leading-tight h-6 flex items-center justify-center dark:text-gray-200">{b.name}</div>
                          <div className={`text-[10px] md:text-xs font-bold ${selectedBox.price === b.price ? "text-gold" : "text-gray-400"}`}>+{b.price} DT</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nom & Prénom" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white p-2 rounded-sm focus:border-gold outline-none" />
                </div>
                <div>
                  <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Téléphone" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white p-2 rounded-sm focus:border-gold outline-none" />
                </div>
                <div>
                  <textarea value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Adresse complète" rows={2} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white p-2 rounded-sm focus:border-gold outline-none"></textarea>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-sm border border-gray-200 dark:border-gray-600 mt-4">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                    <span>Prix du Produit <span className="italic text-gray-400">{selectedProduct.allowBoxes !== false ? (selectedBox.price > 0 ? `(+ ${selectedBox.name})` : "(Sans Boîte)") : ""}</span></span>
                    <span className="font-semibold">{subtotal.toFixed(1)} DT</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                    <span>Frais de livraison</span>
                    <span className={`font-semibold ${shipping === 0 ? "text-green-400" : ""}`}>{shipping === 0 ? (activeDiscount?.type === "shipping" ? "0 DT (Via Roue)" : "0 DT (Offert)") : "8.5 DT"}</span>
                  </div>
                  {activeDiscount && activeDiscount.type !== "none" && (
                    <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-bold mb-2">
                      <span>Remise ({activeDiscount.label})</span>
                      <span>{activeDiscount.type === "gift" ? "Cadeau Inclus" : `-${discountVal.toFixed(1)} DT`}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-3 mt-1">
                    <span>Total</span>
                    <span className="text-gold">{total.toFixed(1)} DT</span>
                  </div>
                </div>
                <button type="button" onClick={submitOrder} className="w-full bg-[#25D366] text-white font-bold py-3 rounded-sm hover:bg-green-600 transition shadow-md flex justify-center items-center space-x-2 mt-4">
                  <i className="fab fa-whatsapp text-xl"></i><span>Confirmer la commande</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
