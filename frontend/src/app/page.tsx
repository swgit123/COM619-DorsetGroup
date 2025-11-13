"use client";
import React, { useMemo, useState } from "react";
import { Heart, MessageCircle, Search, Upload, LogIn, UserRound, LogOut, Bookmark, ImagePlus, Camera, Eye, EyeOff, ChefHat, Star } from "lucide-react";

// --- Simple design tokens ---
const brand = {
  bg: "bg-slate-50",
  card: "bg-white/90 backdrop-blur border border-slate-200 shadow-sm",
  pill: "rounded-2xl",
  radius: "rounded-2xl",
  btn: "px-4 py-2 rounded-xl font-medium",
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  subtle: "bg-slate-100 hover:bg-slate-200 text-slate-800",
  ghost: "hover:bg-slate-100 text-slate-700",
  input: "bg-white/90 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none",
};

// --- Types ---
interface Recipe {
  id: string;
  name: string;
  author: string;
  image: string;
  liked?: boolean;
  favourite?: boolean;
  isPublic?: boolean;
}

// --- Mock data ---
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Creamy Tomato Penne",
    author: "Alex Rivera",
    image: "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8bbf?q=80&w=1200&auto=format&fit=crop",
    liked: true,
    favourite: true,
    isPublic: true,
  },
  {
    id: "2",
    name: "Mediterranean Salad Bowl",
    author: "Samira Q.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop",
    liked: false,
    favourite: false,
    isPublic: true,
  },
  {
    id: "3",
    name: "Lemon Herb Chicken",
    author: "Daniel P.",
    image: "https://images.unsplash.com/photo-1604908176997-4319ea4d1e2a?q=80&w=1200&auto=format&fit=crop",
    isPublic: true,
  },
];

// --- Components ---
function Navbar({ loggedIn, onRoute, onLogout, onLogin }: { loggedIn: boolean; onRoute: (r: Route) => void; onLogout: () => void; onLogin: () => void; }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 select-none">
            <ChefHat className="h-6 w-6" />
            <span className="font-semibold text-slate-900">RecipeShare</span>
          </div>
          <nav className="hidden sm:flex items-center gap-2 ml-4">
            <button onClick={() => onRoute("home")} className={`${brand.btn} ${brand.ghost}`}>Home</button>
            {loggedIn && (
              <>
                <button onClick={() => onRoute("favourites")} className={`${brand.btn} ${brand.ghost}`}>Favourites</button>
                <button onClick={() => onRoute("upload")} className={`${brand.btn} ${brand.primary} flex items-center gap-2`}>
                  <Upload className="h-4 w-4" /> Upload
                </button>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {!loggedIn ? (
            <button onClick={onLogin} className={`${brand.btn} ${brand.subtle} flex items-center gap-2`}>
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          ) : (
            <button onClick={onLogout} className={`${brand.btn} ${brand.subtle} flex items-center gap-2`}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
          <div className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-300">
            <UserRound className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search recipes..."
        className={`w-full pl-11 pr-4 py-3 ${brand.input} ${brand.pill}`}
      />
    </div>
  );
}

function RecipeCard({ recipe, onLike, onFav, onOpen }: { recipe: Recipe; onLike: (id: string) => void; onFav: (id: string) => void; onOpen: (id: string) => void; }) {
  return (
    <article className={`flex gap-4 p-3 ${brand.card} ${brand.radius}`}>
      <img src={recipe.image} alt={recipe.name} className="h-24 w-24 rounded-xl object-cover" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 truncate">{recipe.name}</h3>
        <p className="text-sm text-slate-600">by {recipe.author}</p>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => onLike(recipe.id)} className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}>
            <Heart className={`h-4 w-4 ${recipe.liked ? "fill-red-500 stroke-red-500" : ""}`} /> Like
          </button>
          <button onClick={() => onFav(recipe.id)} className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}>
            <Bookmark className={`h-4 w-4 ${recipe.favourite ? "fill-slate-800 stroke-slate-800" : ""}`} /> Save
          </button>
          <button onClick={() => onOpen(recipe.id)} className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}>
            <MessageCircle className="h-4 w-4" /> Details
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthCard({ mode = "login", onSwitch, onSuccess }: { mode?: "login" | "signup"; onSwitch: () => void; onSuccess: () => void; }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className={`max-w-md w-full p-6 ${brand.card} ${brand.radius} shadow-xl`}>      
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-semibold text-slate-900">{mode === "login" ? "Login / Sign Up" : "Create an account"}</h2>
      </div>

      <label className="block text-sm font-medium text-slate-700">Email Address</label>
      <input type="email" className={`mt-1 mb-3 w-full ${brand.input} ${brand.pill} px-4 py-2`} placeholder="you@example.com"/>

      <label className="block text-sm font-medium text-slate-700">Password</label>
      <div className="relative mt-1 mb-4">
        <input type={showPw ? "text" : "password"} className={`w-full ${brand.input} ${brand.pill} px-4 py-2`} placeholder="••••••••"/>
        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <button onClick={onSuccess} className={`w-full ${brand.btn} ${brand.primary}`}>{mode === "login" ? "Login" : "Create account"}</button>

      <p className="text-center text-sm text-slate-600 mt-3">
        {mode === "login" ? (
          <>No account? <button onClick={onSwitch} className="underline underline-offset-2">Sign up</button>.</>
        ) : (
          <>Already have an account? <button onClick={onSwitch} className="underline underline-offset-2">Log in</button>.</>
        )}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <button className={`mt-4 w-full ${brand.btn} ${brand.subtle} flex items-center justify-center gap-2`}>
        <img alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" />
        Continue with Google
      </button>
    </div>
  );
}

function AuthPage({ mode, onMode, onSuccess }: { mode: "login" | "signup"; onMode: (m: "login" | "signup") => void; onSuccess: () => void; }) {
  const bg = "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1400&auto=format&fit=crop";
  return (
    <div className="relative min-h-[calc(100vh-64px)] grid place-items-center">
      <img src={bg} className="absolute inset-0 h-full w-full object-cover" alt="Pasta"/>
      <div className="absolute inset-0 bg-black/40" />
      <AuthCard mode={mode} onSwitch={() => onMode(mode === "login" ? "signup" : "login")} onSuccess={onSuccess} />
    </div>
  );
}

function ImageDrop() {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className={`flex items-center gap-4 p-4 ${brand.card} ${brand.radius}`}>
      <label className={`h-28 w-28 ${brand.radius} grid place-items-center border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 cursor-pointer`}>
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-cover rounded-xl" />
        ) : (
          <div className="flex flex-col items-center text-sm">
            <ImagePlus className="h-6 w-6 mb-1" />
            Add Photo
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(String(ev.target?.result));
            reader.readAsDataURL(file);
          }}
          className="hidden"
        />
      </label>
      <div className="text-xs text-slate-500">
        JPG/PNG up to 5MB. Add multiple photos after initial save.
      </div>
    </div>
  );
}

// --- Ingredient types & data ---
type Unit = "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "cup" | "piece";
interface PickedIngredient { name: string; quantity: number; unit: Unit; }

const INGREDIENTS = [
  "Pasta","Spaghetti","Rice","Egg","Milk","Butter","Olive oil","Chicken breast",
  "Beef mince","Pork","Salmon","Tuna","Shrimp","Onion","Garlic","Tomato",
  "Tomato paste","Cherry tomatoes","Basil","Parsley","Coriander","Lemon",
  "Lime","Carrot","Celery","Bell pepper","Spinach","Broccoli","Mushrooms",
  "Potato","Sweet potato","Flour","Sugar","Brown sugar","Honey","Salt","Black pepper",
  "Paprika","Cumin","Chili flakes","Soy sauce","Vinegar","Parmesan","Cheddar",
  "Mozzarella","Yogurt","Cream","Coconut milk","Stock cube"
];

function classJoin(...xs: (string|false|undefined)[]) { return xs.filter(Boolean).join(" "); }

function IngredientsPicker({
  value,
  onChange,
}: {
  value: PickedIngredient[];
  onChange: (next: PickedIngredient[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selectedName, setSelectedName] = React.useState<string>("");
  const [qtyText, setQtyText] = React.useState<string>("");
  const [unit, setUnit] = React.useState<Unit>("g");

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const qtyRef = React.useRef<HTMLInputElement | null>(null);

  // Multi-select for existing pills
  const [selectedPills, setSelectedPills] = React.useState<Set<string>>(new Set());

  const suggestions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = INGREDIENTS.filter(
      n => !value.some(v => v.name.toLowerCase() === n.toLowerCase())
    );
    if (!q) return [];
    return pool.filter(n => n.toLowerCase().includes(q)).slice(0, 10);
  }, [query, value]);

  const qty = Number(qtyText);
  const showQtyRow = !!selectedName;

  function resetAll() {
    setQuery("");
    setSelectedName("");
    setQtyText("");
    setUnit("g");
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function chooseIngredient(name: string) {
    setSelectedName(name);
    setQuery("");
    setQtyText("");
    setUnit("g");
    setTimeout(() => qtyRef.current?.focus(), 0);
  }

  function addIngredient() {
    if (!selectedName) return;
    if (!qty || qty <= 0) return;
    onChange([...value, { name: selectedName, quantity: qty, unit }]);
    resetAll();
  }

  function removeIngredient(name: string) {
    onChange(value.filter(v => v.name.toLowerCase() !== name.toLowerCase()));
    setSelectedPills(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function togglePillSelection(name: string) {
    setSelectedPills(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      {/* Search (hidden once a pill is chosen) */}
      {!selectedName && (
        <>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim().length > 0 && suggestions.length === 1) {
                e.preventDefault();
                chooseIngredient(suggestions[0]);
              }
            }}
            placeholder="Start typing an ingredient… (e.g., pasta)"
            className={`${brand.input} ${brand.pill} w-full px-4 py-2`}
          />
          {query.trim().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.length === 0 ? (
                <span className="text-sm text-slate-500">No matches.</span>
              ) : (
                suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => chooseIngredient(name)}
                    className="px-3 py-1 rounded-full border border-slate-200 bg-white/90 hover:bg-slate-100 text-sm text-slate-800"
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Selected ingredient pill */}
      {selectedName && (
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm">
            {selectedName}
          </span>
          <button
            type="button"
            onClick={resetAll}
            className={`${brand.btn} ${brand.subtle}`}
          >
            Cancel
          </button>   
        </div>
      )}

      {/* Quantity + Unit appear together; Enter in qty submits with current unit */}
      {showQtyRow && (
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">How much?</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={qtyRef}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={qtyText}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                if (/^\d*\.?\d*$/.test(v)) setQtyText(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !!Number(qtyText) && Number(qtyText) > 0) {
                  e.preventDefault();
                  addIngredient(); // submit with current unit
                }
              }}
              placeholder="e.g., 200"
              className={`${brand.input} ${brand.pill} px-4 py-2`}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className={`${brand.input} ${brand.pill} px-3 py-2`}
              title="Unit"
            >
              {["g","kg","ml","l","tsp","tbsp","cup","piece"].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addIngredient}
              className={`${brand.btn} ${brand.primary}`}
              disabled={!qty || qty <= 0}
            >
              Add ingredient
            </button>
          </div>
        </div>
      )}

      {/* Added ingredients as pills (wobble when selected) */}
      <div className="flex flex-wrap gap-2 mt-1">
        {value.length === 0 ? (
          <div className="text-sm text-slate-500">No ingredients added yet.</div>
        ) : (
          value.map((ing) => {
            const isSelected = selectedPills.has(ing.name);
            return (
              <div
                key={ing.name}
                onClick={() => togglePillSelection(ing.name)}
                className={[
                  "relative select-none cursor-pointer px-3 py-1 rounded-full border text-sm",
                  "bg-white/90 border-slate-200 text-slate-800 hover:bg-slate-100",
                  isSelected ? "ring-2 ring-blue-400 animate-wobble" : ""
                ].join(" ")}
                title={`${ing.name} ${ing.quantity} ${ing.unit}`}
              >
                <span className="pr-6">
                  {ing.name} {ing.quantity} {ing.unit}
                </span>
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeIngredient(ing.name); }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center shadow hover:bg-red-600"
                    aria-label={`Delete ${ing.name}`}
                    title="Delete"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* wobble animation */}
      <style jsx global>{`
        @keyframes wobble {
          0%, 100% { transform: rotate(-0.6deg) translateY(0); }
          50% { transform: rotate(0.6deg) translateY(-1px); }
        }
        .animate-wobble {
          animation: wobble 250ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}






function UploadPage() {
  const [ingredients, setIngredients] = useState<PickedIngredient[]>([]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className={`p-6 ${brand.card} ${brand.radius}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="h-5 w-5" /> Upload a Recipe
          </h2>
        </div>

        <div className="grid gap-4">
          <ImageDrop />

          {/* Name */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Recipe Name</label>
            <input
              className={`${brand.input} ${brand.pill} px-4 py-2`}
              placeholder="e.g., Garlic Butter Shrimp"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={4}
              className={`${brand.input} ${brand.radius} p-3`}
              placeholder="Short description of your recipe"
            />
          </div>

          {/* Ingredients (picker) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Ingredients</label>
            <IngredientsPicker value={ingredients} onChange={setIngredients} />
          </div>

          {/* Steps */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Steps</label>
            <textarea
              rows={5}
              className={`${brand.input} ${brand.radius} p-3`}
              placeholder="1) Boil pasta..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button className={`${brand.btn} ${brand.subtle}`}>Save Draft</button>
            <button
              className={`${brand.btn} ${brand.primary}`}
              onClick={() =>
                console.log("Submit payload:", {
                  // name, description, steps would be read from state when you wire the form
                  ingredients,
                })
              }
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function HomePage({
  loggedIn,
  items,
  onLike,
  onFav,
}: {
  loggedIn: boolean;
  items: Recipe[];
  onLike: (id: string) => void;
  onFav: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return items.filter(
      r => r.name.toLowerCase().includes(s) || r.author.toLowerCase().includes(s)
    );
  }, [q, items]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className={`p-4 sm:p-6 ${brand.card} ${brand.radius} mb-4`}>
        <SearchBar value={q} onChange={setQ} />
        <p className="text-xs text-slate-500 mt-2">
          {loggedIn
            ? "Browse and interact with recipes. Your likes & saves will sync to your account."
            : "You are viewing as a guest. Sign in to like, save, and comment."}
        </p>
      </div>
      <div className="grid gap-4">
        {filtered.map(r => (
          <RecipeCard
            key={r.id}
            recipe={r}
            onLike={onLike}
            onFav={onFav}
            onOpen={() => alert(`Open recipe ${r.name}`)}
          />
        ))}
      </div>
    </div>
  );
}

function FavouritesPage({
  loggedIn,
  items,
  onLike,
  onFav,
}: {
  loggedIn: boolean;
  items: Recipe[];
  onLike: (id: string) => void;
  onFav: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const favourites = useMemo(
    () => items.filter(r => r.favourite),
    [items]
  );

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return favourites.filter(
      r => r.name.toLowerCase().includes(s) || r.author.toLowerCase().includes(s)
    );
  }, [q, favourites]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className={`p-4 sm:p-6 ${brand.card} ${brand.radius} mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <SearchBar value={q} onChange={setQ} />
            <p className="text-xs text-slate-500 mt-2">Your saved recipes.</p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={`p-6 ${brand.card} ${brand.radius} text-slate-600`}>
          {loggedIn
            ? "You haven’t saved any recipes yet."
            : "Sign in to save favourites."}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onLike={onLike}
              onFav={onFav}
              onOpen={() => alert(`Open recipe ${r.name}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}



// --- Router ---
type Route = "home" | "upload" | "auth" | "favourites";

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Lifted recipe state so Home & Favourites see the same data
  const [items, setItems] = useState<Recipe[]>(mockRecipes);

  const toggleLike = (id: string) =>
    setItems(prev => prev.map(r => (r.id === id ? { ...r, liked: !r.liked } : r)));
  const toggleFav = (id: string) =>
    setItems(prev => prev.map(r => (r.id === id ? { ...r, favourite: !r.favourite } : r)));

  return (
    <div className={`${brand.bg} text-slate-900 min-h-screen`}>
      <Navbar
        loggedIn={loggedIn}
        onRoute={setRoute}
        onLogout={() => { setLoggedIn(false); setRoute("home"); }}
        onLogin={() => { setRoute("auth"); setAuthMode("login"); }}
      />

      {route === "auth" ? (
        <AuthPage
          mode={authMode}
          onMode={setAuthMode}
          onSuccess={() => { setLoggedIn(true); setRoute("home"); }}
        />
      ) : route === "upload" ? (
        loggedIn ? (
          <UploadPage />
        ) : (
          <AuthPage
            mode="login"
            onMode={setAuthMode}
            onSuccess={() => { setLoggedIn(true); setRoute("upload"); }}
          />
        )
      ) : route === "favourites" ? (
        <FavouritesPage
          loggedIn={loggedIn}
          items={items}
          onLike={toggleLike}
          onFav={toggleFav}
        />
      ) : (
        <HomePage
          loggedIn={loggedIn}
          items={items}
          onLike={toggleLike}
          onFav={toggleFav}
        />
      )}

      <footer className="border-t border-slate-200 py-10 mt-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-slate-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} RecipeShare </p>
        </div>
      </footer>
    </div>
  );
}
