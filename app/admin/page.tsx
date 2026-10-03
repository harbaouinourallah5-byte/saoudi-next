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

    // State for new product form
    const [prodName, setProdName] = useState("");
    const [prodPrice, setProdPrice] = useState("");
    const [prodCategory, setProdCategory] = useState("Montres");
    const [prodDesc, setProdDesc] = useState("");
    const [prodImg, setProdImg] = useState("");
    const [inStock, setInStock] = useState(true);
    const [freeShipping, setFreeShipping] = useState(false);
    const [allowBoxes, setAllowBoxes] = useState(true);
    const [boxQuantity, setBoxQuantity] = useState(0);
    const [boxes, setBoxes] = useState<{name: string, price: string, img: string}[]>([]);

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
            } else {
                alert("Nom d'utilisateur ou mot de passe incorrect !");
            }
        } catch(e) {
            alert("Erreur de connexion au serveur !");
        }
    };
            } else {
                alert("Nom d'utilisateur ou mot de passe incorrect !");
            }
        } catch(e) {
            alert("Erreur de connexion au serveur !");
        }
    };

    const loadAdminProducts = async (token?: string) => {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) return;
            const data = await response.json();
            setProducts(data);
        } catch(e) { console.error(e); }
    };

    const handleProdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                if (event.target?.result) {
                    setProdImg(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
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

    const handleBoxImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                if (event.target?.result) {
                    updateBox(index, "img", event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const saveEverything = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(prodPrice);
        if (!prodName || isNaN(priceNum) || !prodDesc) {
            alert("Veuillez remplir le nom, le prix et la description du produit.");
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
            const productRes = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({
                    title: prodName,
                    price: priceNum,
                    desc: prodDesc,
                    category: prodCategory,
                    inStock,
                    freeShipping,
                    allowBoxes,
                    boxes: productBoxes,
                    img: prodImg || 'assets/logo.jpg'
                })
            });

            if (productRes.ok) {
                alert("Produit enregistré avec succès ! 🎉");
                setProdName("");
                setProdPrice("");
                setProdDesc("");
                setProdCategory("Montres");
                setProdImg("");
                setInStock(true);
                setFreeShipping(false);
                setAllowBoxes(true);
                setBoxQuantity(0);
                setBoxes([]);
                loadAdminProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const errText = await productRes.text();
                alert("Erreur lors de l'enregistrement du produit: " + errText);
            }
        } catch(e: any) {
            alert("Erreur de connexion au serveur local: " + e.message);
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
                            <li><a href="#ajouter" className="block p-3 rounded-md bg-gray-50 text-yellow-600 font-bold border-l-4 border-yellow-500"><i className="fas fa-plus-circle w-6"></i> Ajouter un Produit</a></li>
                            <li><a href="#liste" className="block p-3 rounded-md text-gray-600 hover:bg-gray-50 transition"><i className="fas fa-list w-6"></i> Liste des Produits</a></li>
                        </ul>
                    </div>
                </div>

                <div className="w-full md:w-3/4">
                    
                    <div className="flex items-center justify-between mb-6">
                        <h2 id="ajouter" className="text-2xl font-bold text-gray-800">Créer un Nouveau Produit</h2>
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
                                        <option value="Parures">Parures</option>
                                        <option value="Bracelets">Bracelets</option>
                                        <option value="Bagues">Bagues</option>
                                        <option value="Packs">Packs Cadeaux</option>
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

                            <div className="flex items-center space-x-4 pt-6 border-t border-gray-100">
                                <button type="submit" className="bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-md hover:bg-yellow-600 transition shadow-lg text-lg uppercase tracking-wider w-full flex items-center justify-center space-x-2">
                                    <i className="fas fa-save"></i> <span>Enregistrer le Produit</span>
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
                                            <button onClick={() => toggleStock(p.title, p.inStock !== false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded text-sm mr-2">
                                                <i className="fas fa-exchange-alt"></i> Stock
                                            </button>
                                            <button onClick={() => deleteProduct(p.title)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded text-sm">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    );
}
