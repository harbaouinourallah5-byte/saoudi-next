"use client";

import React, { useState, useEffect } from "react";

export default function AdminPage() {
    // State for auth
    const [authToken, setAuthToken] = useState("");
    const [loginUser, setLoginUser] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // State for products list
    const [products, setProducts] = useState<any[]>([]);
    
    // State for orders list
    const [orders, setOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"products"|"orders">("products");
    const [orderFilter, setOrderFilter] = useState<"toutes"|"nouvelle"|"en attente"|"confirmée"|"rejetée">("nouvelle");

    // State for new product form
    const [prodName, setProdName] = useState("");
    const [prodPrice, setProdPrice] = useState("");
    const [prodCategory, setProdCategory] = useState("Montres");
    const [prodGender, setProdGender] = useState("");
    const [prodDesc, setProdDesc] = useState("");
    const [prodImg, setProdImg] = useState("");
    const [prodGallery, setProdGallery] = useState<string[]>([]);
    const [inStock, setInStock] = useState(true);
    const [freeShipping, setFreeShipping] = useState(false);
    const [allowBoxes, setAllowBoxes] = useState(true);
    const [boxQuantity, setBoxQuantity] = useState(0);
    const [boxes, setBoxes] = useState<{name: string, price: string, img: string}[]>([]);
    const [prodColors, setProdColors] = useState<{name: string, hex: string, quantity: number, image: string}[]>([]);
    const [combinations, setCombinations] = useState<Record<string, string>>({});
    
    // State for editing mode
    const [editingProductTitle, setEditingProductTitle] = useState("");

    // Toast State
    const [toast, setToast] = useState<{show: boolean, msg: string, type: "success"|"error"}>({show: false, msg: "", type: "success"});

    const showToast = (msg: string, type: "success"|"error" = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3500);
    };

    useEffect(() => {
        // No persistent token loading. User must log in every time.
    }, []);

    const attemptLogin = async () => {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: loginUser, password: loginPass})
            });
            if(res.ok) {
                const data = await res.json();
                setAuthToken(data.token);
                // Token is kept ONLY in memory for maximum security.
                setIsLoggedIn(true);
                loadAdminProducts(data.token);
                loadOrders(data.token);
            } else {
                showToast("Nom d'utilisateur ou mot de passe incorrect !", "error");
            }
        } catch(e) {
            showToast("Erreur de connexion au serveur !", "error");
        }
    };

    const loadAdminProducts = async (token?: string) => {
        try {
            const response = await fetch('/api/products', { cache: 'no-store' });
            if (!response.ok) return;
            const data = await response.json();
            setProducts(data);
        } catch(e) { console.error(e); }
    };

    const loadOrders = async (token = authToken) => {
        try {
            const res = await fetch(`/api/orders?t=${Date.now()}`, {
                headers: { 'Authorization': 'Bearer ' + token },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (e) {
            console.error("Failed to fetch orders", e);
        }
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800; // Auto-resize if bigger than 800px

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#ffffff'; // White background for transparency
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.65)); // 65% quality JPEG
                    } else {
                        resolve(event.target?.result as string);
                    }
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleProdImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                setProdImg(compressedBase64);
            } catch (e) {
                console.error("Compression error:", e);
            }
        }
    };

    const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            try {
                const base64Images = await Promise.all(files.map(file => compressImage(file)));
                setProdGallery(prev => [...prev, ...base64Images].slice(0, 4)); // max 4 photos for gallery
            } catch (e) {
                console.error("Gallery compression error:", e);
            }
        }
    };

    const handleBoxQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const qty = parseInt(e.target.value) || 0;
        setBoxQuantity(qty);
        
        setBoxes(prev => {
            const newBoxes = [...prev];
            if (qty > newBoxes.length) {
                for (let i = newBoxes.length; i < qty; i++) {
                    newBoxes.push({ name: "", price: "", img: "" });
                }
            } else {
                newBoxes.length = qty;
            }
            return newBoxes;
        });
    };

    const updateBox = (index: number, field: keyof typeof boxes[0], value: string) => {
        const newBoxes = [...boxes];
        newBoxes[index][field] = value;
        setBoxes(newBoxes);
    };

    const handleBoxImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                updateBox(index, "img", compressedBase64);
            } catch (err) {
                console.error(err);
            }
        }
    };
    const addColor = () => {
        setProdColors([...prodColors, { name: "", hex: "#000000", quantity: 0, image: "" }]);
    };

    const updateColor = (index: number, field: string, value: string | number) => {
        const newColors = [...prodColors];
        (newColors[index] as any)[field] = value;
        setProdColors(newColors);
    };

    const removeColor = (index: number) => {
        const newColors = [...prodColors];
        newColors.splice(index, 1);
        setProdColors(newColors);
    };

    const handleColorImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                updateColor(index, "image", compressedBase64);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const saveEverything = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(prodPrice);
        if (!prodName || isNaN(priceNum) || !prodDesc) {
            showToast("Veuillez remplir le nom, le prix et la description du produit.", "error");
            return;
        }

        let productBoxes: any[] = [];
        if (allowBoxes) {
            productBoxes = boxes.filter(b => b.name && !isNaN(parseFloat(b.price)) && b.img).map(b => ({
                ...b,
                price: parseFloat(b.price)
            }));
        }

        try {
            const url = editingProductTitle ? `/api/products/${encodeURIComponent(editingProductTitle)}` : '/api/products';
            const method = editingProductTitle ? 'PUT' : 'POST';

            const productRes = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({
                    title: prodName,
                    price: priceNum,
                    desc: prodDesc,
                    category: prodCategory,
                    gender: prodGender,
                    inStock,
                    freeShipping,
                    allowBoxes,
                    boxes: productBoxes,
                    img: prodImg || 'assets/logo.jpg',
                    gallery: prodGallery,
                    colors: prodColors,
                    combinations
                })
            });

            if (productRes.ok) {
                showToast(`Produit ${editingProductTitle ? 'modifié' : 'enregistré'} avec succès ! 🎉`, "success");
                setEditingProductTitle("");
                setProdName("");
                setProdPrice("");
                setProdDesc("");
                setProdCategory("Montres");
                setProdGender("");
                setProdImg("");
                setProdGallery([]);
                setProdColors([]);
                setCombinations({});
                setInStock(true);
                setFreeShipping(false);
                setAllowBoxes(true);
                setBoxQuantity(0);
                setBoxes([]);
                loadAdminProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const errText = await productRes.text();
                showToast("Erreur lors de l'enregistrement du produit: " + errText, "error");
            }
        } catch(e: any) {
            showToast("Erreur de connexion au serveur local: " + e.message, "error");
        }
    };

    const toggleStock = async (title: string, isCurrentlyInStock: boolean) => {
        try {
            await fetch(`/api/products/${encodeURIComponent(title)}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ inStock: !isCurrentlyInStock })
            });
            loadAdminProducts();
        } catch (e) {
            console.error(e);
        }
    };

    const editProduct = (product: any) => {
        setEditingProductTitle(product.title);
        setProdName(product.title);
        setProdPrice(product.price.toString());
        setProdDesc(product.desc);
        setProdCategory(product.category || "Montres");
        setProdGender(product.gender || "");
        setProdImg(product.img || "");
        setProdGallery(product.gallery || []);
        setProdColors(product.colors || []);
        setCombinations(product.combinations || {});
        setInStock(product.inStock !== false);
        setFreeShipping(product.freeShipping === true);
        
        if (product.allowBoxes !== false && product.boxes && product.boxes.length > 0) {
            setAllowBoxes(true);
            setBoxQuantity(product.boxes.length);
            setBoxes(product.boxes.map((b: any) => ({
                name: b.name,
                price: b.price.toString(),
                img: b.img || ""
            })));
        } else {
            setAllowBoxes(false);
            setBoxQuantity(0);
            setBoxes([]);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateOrderStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                // Optimistic UI update
                setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
                showToast(`Commande ${status}`, 'success');
                // Optionnel: loadOrders() en background, pas indispensable vu l'update local
                loadOrders();
            } else {
                showToast('Erreur', 'error');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteProduct = async (title: string) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
            try {
                await fetch(`/api/products/${encodeURIComponent(title)}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                loadAdminProducts();
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="text-gray-800 font-sans min-h-screen bg-[#050505]">
            
            {/* CUSTOM TOAST NOTIFICATION */}
            <div 
                className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} flex items-center space-x-3 px-6 py-3 rounded-full shadow-2xl ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#25D366] text-white'}`}
            >
                <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} text-lg`}></i>
                <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
            </div>

            {!isLoggedIn && (
                <div id="login-overlay" className="fixed inset-0 bg-black z-[100] flex items-center justify-center bg-[url('/assets/bg-pattern.png')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-[90%] max-w-md border border-gray-800/50 transform transition-all">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl brand-font tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 mb-2 brand-glow">SAOUDI</h2>
                            <p className="text-gray-400 text-xs tracking-[0.3em] uppercase">Espace Privé</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="relative group">
                                    <i className="fas fa-user absolute left-4 top-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors"></i>
                                    <input 
                                        type="text" 
                                        value={loginUser}
                                        onChange={(e) => setLoginUser(e.target.value)}
                                        placeholder="Identifiant" 
                                        className="w-full bg-black/50 border border-gray-800 text-white pl-12 p-4 rounded-xl focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600" 
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="relative group">
                                    <i className="fas fa-key absolute left-4 top-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors"></i>
                                    <input 
                                        type="password" 
                                        value={loginPass}
                                        onChange={(e) => setLoginPass(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
                                        placeholder="Mot de passe" 
                                        className="w-full bg-black/50 border border-gray-800 text-white pl-12 p-4 rounded-xl focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600" 
                                    />
                                </div>
                            </div>
                            <button onClick={attemptLogin} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold tracking-widest uppercase text-sm py-4 rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-8">
                                Se connecter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="bg-gray-900 text-white shadow-md p-4 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <img src="/assets/logo.jpg" className="h-10 w-10 rounded-full border-2 border-yellow-500" alt="Logo" />
                        <span className="text-xl font-bold tracking-widest uppercase">Saoudi Admin</span>
                    </div>
                    <a href="/" className="bg-yellow-500 text-gray-900 px-4 py-2 rounded font-bold text-sm hover:bg-yellow-600 transition">
                        <i className="fas fa-store mr-2"></i>Voir la boutique
                    </a>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
                
                <div className="w-full md:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                        <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">Menu</h3>
                        <ul className="space-y-2">
                            <li><button onClick={() => setActiveTab('products')} className={`block w-full text-left p-3 rounded-md transition ${activeTab === 'products' ? 'bg-gray-50 text-yellow-600 font-bold border-l-4 border-yellow-500' : 'text-gray-600 hover:bg-gray-50'}`}><i className="fas fa-box w-6"></i> Produits</button></li>
                            <li><button onClick={() => setActiveTab('orders')} className={`block w-full text-left p-3 rounded-md transition ${activeTab === 'orders' ? 'bg-gray-50 text-yellow-600 font-bold border-l-4 border-yellow-500' : 'text-gray-600 hover:bg-gray-50'}`}><i className="fas fa-shopping-cart w-6"></i> Commandes {orders.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{orders.length}</span>}</button></li>
                        </ul>
                    </div>
                </div>

                <div className="w-full md:w-3/4">
                    
                    {activeTab === 'products' && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="ajouter" className="text-2xl font-bold text-gray-800">
                            {editingProductTitle ? `Modifier: ${editingProductTitle}` : 'Créer un Nouveau Produit'}
                        </h2>
                        {editingProductTitle && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingProductTitle("");
                                    setProdName("");
                                    setProdPrice("");
                                    setProdDesc("");
                                    setProdImg("");
                                    setBoxes([]);
                                    setBoxQuantity(0);
                                    setCombinations({});
                                }}
                                className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition"
                            >
                                Annuler la modification
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl mb-12">
                        <form className="space-y-6" onSubmit={saveEverything}>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nom du Produit</label>
                                    <input 
                                        type="text" 
                                        value={prodName}
                                        onChange={(e) => setProdName(e.target.value)}
                                        placeholder="Ex: Montre Rolex Style" 
                                        className="w-full border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Prix (DT)</label>
                                    <input 
                                        type="number" 
                                        value={prodPrice}
                                        onChange={(e) => setProdPrice(e.target.value)}
                                        placeholder="Ex: 35" 
                                        className="w-full border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                                    <select 
                                        value={prodCategory}
                                        onChange={(e) => setProdCategory(e.target.value)}
                                        className="w-full border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none bg-white"
                                    >
                                        <option value="Montres">Montres & Duo</option>
                                        <option value="Colliers_Bracelets">Colliers & Bracelets</option>
                                        <option value="Couple">Couple</option>
                                        <option value="Bagues">Bagues</option>
                                        <option value="Packs">Packs Cadeaux</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Genre (Cible)</label>
                                    <select 
                                        value={prodGender}
                                        onChange={(e) => setProdGender(e.target.value)}
                                        className="w-full border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none bg-white"
                                    >
                                        <option value="">Non spécifié</option>
                                        <option value="femme">Femme</option>
                                        <option value="homme">Homme</option>
                                        <option value="mixte">Mixte</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea 
                                    rows={3} 
                                    value={prodDesc}
                                    onChange={(e) => setProdDesc(e.target.value)}
                                    placeholder="Décrivez votre produit..." 
                                    className="w-full border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none bg-white"
                                ></textarea>
                            </div>

                            {/* COULEURS */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold text-gray-700">Couleurs du Produit</label>
                                    <button type="button" onClick={addColor} className="bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded shadow hover:bg-blue-700 transition">
                                        + Ajouter Couleur
                                    </button>
                                </div>
                                {prodColors.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic text-center py-2">Aucune couleur spécifiée. (Optionnel)</p>
                                ) : (
                                    <div className="space-y-4">
                                        {prodColors.map((color, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 border rounded shadow-sm relative group">
                                                <input 
                                                    type="color" 
                                                    value={color.hex}
                                                    onChange={e => updateColor(index, "hex", e.target.value)}
                                                    className="w-10 h-10 cursor-pointer shrink-0"
                                                    title="Sélectionner la couleur"
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Nom (ex: Rouge)" 
                                                    value={color.name}
                                                    onChange={e => updateColor(index, "name", e.target.value)}
                                                    className="flex-grow border p-2 rounded text-sm outline-none focus:border-yellow-500"
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="Qté (Stock)" 
                                                    value={color.quantity}
                                                    onChange={e => updateColor(index, "quantity", parseInt(e.target.value) || 0)}
                                                    className="w-24 border p-2 rounded text-sm outline-none focus:border-yellow-500"
                                                />
                                                
                                                <div className="relative w-12 h-12 border border-gray-300 rounded overflow-hidden flex items-center justify-center shrink-0 hover:bg-gray-100 cursor-pointer">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleColorImageChange(index, e)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        title="Image spécifique à la couleur"
                                                    />
                                                    {color.image ? (
                                                        <img src={color.image} className="w-full h-full object-cover" alt="Color" />
                                                    ) : (
                                                        <i className="fas fa-image text-gray-400"></i>
                                                    )}
                                                </div>

                                                <button type="button" onClick={() => removeColor(index)} className="text-red-500 hover:bg-red-50 p-2 rounded transition ml-2">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Photo du produit</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer relative overflow-hidden bg-white">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        accept="image/*" 
                                        onChange={handleProdImageChange}
                                    />
                                    {!prodImg ? (
                                        <>
                                            <i className="fas fa-cloud-upload-alt text-4xl mb-3 text-yellow-500"></i>
                                            <span className="text-sm">Cliquez pour sélectionner une image</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm mb-2">Image modifiée</span>
                                            <img src={prodImg} className="max-h-40 mt-4 rounded shadow-md object-contain" alt="Preview" />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Galerie d'images secondaires (Optionnel, Max 4)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer relative overflow-hidden bg-white">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        accept="image/*"
                                        multiple
                                        onChange={handleGalleryImagesChange}
                                    />
                                    <i className="fas fa-images text-3xl mb-3 text-yellow-500"></i>
                                    <span className="text-sm">Cliquez pour ajouter d'autres photos</span>
                                </div>
                                {prodGallery.length > 0 && (
                                    <div className="flex space-x-4 mt-4 overflow-x-auto p-2 bg-gray-50 border rounded-md">
                                        {prodGallery.map((img, idx) => (
                                            <div key={idx} className="relative group shrink-0">
                                                <img src={img} className="h-20 w-20 object-cover rounded shadow-sm border border-gray-200" alt={`Gallery ${idx}`} />
                                                <button 
                                                    type="button"
                                                    onClick={() => setProdGallery(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition z-10"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={inStock}
                                        onChange={(e) => setInStock(e.target.checked)}
                                        className="w-5 h-5 accent-yellow-500" 
                                    />
                                    <span className="font-bold text-gray-700">En Stock</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={freeShipping}
                                        onChange={(e) => setFreeShipping(e.target.checked)}
                                        className="w-5 h-5 accent-yellow-500" 
                                    />
                                    <span className="font-bold text-gray-700">Livraison Gratuite</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={allowBoxes}
                                        onChange={(e) => setAllowBoxes(e.target.checked)}
                                        className="w-5 h-5 accent-yellow-500" 
                                    />
                                    <span className="font-bold text-gray-700">Proposer des Boîtes</span>
                                </label>
                            </div>

                            {allowBoxes && (
                                <div className="bg-yellow-50/50 p-6 rounded-md border border-yellow-200 mt-6 transition-all">
                                    <div className="flex items-center space-x-2 mb-4 text-yellow-700">
                                        <i className="fas fa-info-circle"></i>
                                        <p className="text-sm font-semibold">Les emballages (boîtes) que vous créez ici seront enregistrés et proposés <span className="font-bold underline">uniquement pour ce produit</span>.</p>
                                    </div>
                                    
                                    <div className="mb-6 bg-white p-4 rounded-md border border-yellow-200 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Combien de styles d'emballage voulez-vous proposer pour ce produit ? (0 = aucun)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="10" 
                                            value={boxQuantity}
                                            onChange={handleBoxQuantityChange}
                                            className="w-full md:w-32 border border-gray-300 p-3 rounded-md focus:border-yellow-500 outline-none font-bold text-lg text-center shadow-inner"
                                        />
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {boxes.map((box, i) => (
                                            <div key={i} className="box-entry border border-yellow-200 p-6 rounded-md bg-white relative shadow-sm">
                                                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wider text-xs text-yellow-600">Nouvel Emballage #{i+1}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'emballage</label>
                                                        <input 
                                                            type="text" 
                                                            value={box.name}
                                                            onChange={(e) => updateBox(i, "name", e.target.value)}
                                                            className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-yellow-500" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Prix (DT)</label>
                                                        <input 
                                                            type="number" 
                                                            value={box.price}
                                                            onChange={(e) => updateBox(i, "price", e.target.value)}
                                                            className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-yellow-500" 
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Photo de la boîte</label>
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 cursor-pointer relative overflow-hidden transition hover:bg-gray-100">
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                            accept="image/*" 
                                                            onChange={(e) => handleBoxImageChange(i, e)}
                                                        />
                                                        {!box.img ? (
                                                            <>
                                                                <i className="fas fa-gift text-3xl mb-2 text-yellow-500"></i>
                                                                <span className="text-sm">Sélectionner une photo</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-sm mb-2">Image modifiée</span>
                                                                <img src={box.img} className="max-h-24 mt-2 rounded shadow-sm object-contain" alt="Box preview" />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {prodColors.length > 0 && boxes.length > 0 && (
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-xl font-bold mb-4 text-gray-800"><i className="fas fa-layer-group text-yellow-500 mr-2"></i>Photos des Combinaisons (Optionnel)</h3>
                                    <p className="text-sm text-gray-500 mb-6">Ajoutez une photo spécifique pour chaque combinaison (Couleur + Boîte). Si vide, l'image de la couleur choisie sera affichée.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {prodColors.map(color => boxes.map(box => {
                                            const comboKey = `${color.name}---${box.name}`;
                                            return (
                                                <div key={comboKey} className="border border-gray-300 rounded p-4 bg-white shadow-sm flex flex-col items-center">
                                                    <span className="text-xs font-bold text-gray-700 mb-2 text-center uppercase">{color.name} + {box.name}</span>
                                                    {combinations[comboKey] ? (
                                                        <div className="relative mb-2 w-full flex justify-center">
                                                            <img src={combinations[comboKey]} className="h-20 w-20 object-cover rounded shadow" alt="combo" />
                                                            <button 
                                                                type="button" 
                                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600 transition"
                                                                style={{ transform: 'translate(25%, -25%)' }}
                                                                onClick={() => {
                                                                    const newC = {...combinations};
                                                                    delete newC[comboKey];
                                                                    setCombinations(newC);
                                                                }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded text-xs font-bold transition w-full text-center mb-2">
                                                            <i className="fas fa-upload mr-1"></i> Image
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if(!file) return;
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => {
                                                                        if (ev.target?.result) {
                                                                            setCombinations(prev => ({ ...prev, [comboKey]: ev.target!.result as string }));
                                                                        }
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        }))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-4 pt-6 border-t border-gray-100">
                                <button type="submit" className="bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-md hover:bg-yellow-600 transition shadow-lg text-lg uppercase tracking-wider w-full flex items-center justify-center space-x-2">
                                    <i className="fas fa-save"></i> <span>{editingProductTitle ? 'Mettre à jour' : 'Enregistrer le Produit'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <h3 id="liste" className="text-xl font-bold mb-6 max-w-4xl">Vos Produits</h3>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl mb-12">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-bold border-b">Produit</th>
                                    <th className="p-4 font-bold border-b">Statut</th>
                                    <th className="p-4 font-bold border-b text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 flex items-center space-x-3">
                                            <img src={p.img} className="h-12 w-12 rounded object-cover shadow-sm" alt={p.title} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{p.title}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1 border border-gray-200">{p.category || 'Non classé'}</span>
                                                <span className="text-sm text-gray-500 mt-1">{p.price} DT</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-start space-y-1">
                                                {p.inStock !== false ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">EN STOCK</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">ÉPUISÉ</span>
                                                )}
                                                
                                                {p.freeShipping === true && (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold mt-1">LIVRAISON 0 DT</span>
                                                )}
                                                
                                                {p.allowBoxes === false ? (
                                                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold mt-1">
                                                        <i className="fas fa-ban mr-1"></i>SANS BOÎTE
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold mt-1">
                                                        <i className="fas fa-box-open mr-1"></i>{(p.boxes && p.boxes.length) || 0} BOÎTES
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => editProduct(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded text-sm mr-2 transition">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => toggleStock(p.title, p.inStock !== false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded text-sm mr-2 transition">
                                                <i className="fas fa-exchange-alt"></i>
                                            </button>
                                            <button onClick={() => deleteProduct(p.title)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded text-sm transition">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                        </>
                    )}

                    {activeTab === 'orders' && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6"><i className="fas fa-shopping-cart text-yellow-500 mr-2"></i>Liste des Commandes</h2>
                            
                            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                                {['toutes', 'nouvelle', 'en attente', 'confirmée', 'rejetée'].map(filter => (
                                    <button 
                                        key={filter} 
                                        onClick={() => setOrderFilter(filter as any)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                                            orderFilter === filter ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filter}
                                        {filter !== 'toutes' && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">{orders.filter(o => (o.status || 'nouvelle').toLowerCase() === filter).length}</span>}
                                    </button>
                                ))}
                            </div>
                            
                            {orders.filter(o => orderFilter === 'toutes' || (o.status || 'nouvelle').toLowerCase() === orderFilter).length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <i className="fas fa-box-open text-4xl mb-3 text-gray-300"></i>
                                    <p>Aucune commande dans cette catégorie.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.filter(o => orderFilter === 'toutes' || (o.status || 'nouvelle').toLowerCase() === orderFilter).map((order, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                                            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800">{order.customer.name}</h3>
                                                    <p className="text-sm text-gray-600"><i className="fas fa-phone mr-1"></i>{order.customer.phone}</p>
                                                    <p className="text-sm text-gray-600"><i className="fas fa-map-marker-alt mr-1"></i>{order.customer.address}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
                                                        order.status === 'confirmée' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'rejetée' ? 'bg-red-100 text-red-800' :
                                                        order.status === 'en attente' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>{order.status || 'NOUVELLE'}</span>
                                                    <p className="text-xs text-gray-400 mt-2">{new Date(order.date).toLocaleString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Articles</h4>
                                                {order.cart.map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-white p-2 border border-gray-100 rounded">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-gray-800">{item.title}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {item.color ? `Couleur: ${item.color} | ` : ''}
                                                                Boîte: {item.box}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm text-gray-600">{item.qty}x</span>
                                                            <span className="font-bold text-yellow-600 ml-3">{item.price} DT</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                                                <span className="text-gray-600 text-sm">Frais de livraison: {order.shipping} DT</span>
                                                <span className="text-lg font-bold text-gray-900">Total: <span className="text-yellow-600">{order.total} DT</span></span>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                                                <button onClick={() => updateOrderStatus(order._id, 'confirmée')} className="px-4 py-2 bg-green-500 text-white rounded text-sm font-bold shadow hover:bg-green-600 transition"><i className="fas fa-check mr-2"></i>Confirmer</button>
                                                <button onClick={() => updateOrderStatus(order._id, 'rejetée')} className="px-4 py-2 bg-red-500 text-white rounded text-sm font-bold shadow hover:bg-red-600 transition"><i className="fas fa-times mr-2"></i>Rejeter</button>
                                                <button onClick={() => updateOrderStatus(order._id, 'en attente')} className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-bold shadow hover:bg-gray-600 transition"><i className="fas fa-clock mr-2"></i>En attente</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
