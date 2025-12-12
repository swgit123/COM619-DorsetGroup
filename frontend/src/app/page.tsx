"use client";
import React, {useMemo, useState} from "react";
import {
  Heart,
  MessageCircle,
  Search,
  Upload,
  LogIn,
  UserRound,
  LogOut,
  Bookmark,
  ImagePlus,
  Camera,
  Eye,
  EyeOff,
  ChefHat,
  Star,
  X,
  Settings,
  User,
  Lock,
  ChevronDown,
} from "lucide-react";

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
  input:
    "bg-white/90 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none",
};

// --- Types ---
interface Recipe {
  _id?: string;
  _rev?: string;
  id?: string;
  name: string;
  description?: string;
  author?: string; // Display name (can change)
  authorId?: string; // Immutable user ID reference
  image?: string; // Base64 data URL or external URL
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  steps?: string;
  liked?: boolean;
  favourite?: boolean;
  isPublic?: boolean;
}

interface User {
  _id: string;
  _rev?: string;
  username: string;
  password: string;
}

// --- Mock data ---
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Creamy Tomato Penne",
    author: "Alex Rivera",
    image:
      "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8bbf?q=80&w=1200&auto=format&fit=crop",
    liked: true,
    favourite: true,
    isPublic: true,
  },
  {
    id: "2",
    name: "Mediterranean Salad Bowl",
    author: "Samira Q.",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop",
    liked: false,
    favourite: false,
    isPublic: true,
  },
  {
    id: "3",
    name: "Lemon Herb Chicken",
    author: "Daniel P.",
    image:
      "https://images.unsplash.com/photo-1604908176997-4319ea4d1e2a?q=80&w=1200&auto=format&fit=crop",
    isPublic: true,
  },
];

// --- Components ---
function Navbar({
  loggedIn,
  onRoute,
  onLogout,
  onLogin,
  currentUser,
  userProfileImage,
}: {
  loggedIn: boolean;
  onRoute: (r: Route) => void;
  onLogout: () => void;
  onLogin: () => void;
  currentUser: string;
  userProfileImage?: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 select-none">
            <ChefHat className="h-6 w-6" />
            <span className="font-semibold text-slate-900">RecipeShare</span>
          </div>
          <nav className="hidden sm:flex items-center gap-2 ml-4">
            <button
              onClick={() => onRoute("home")}
              className={`${brand.btn} ${brand.ghost}`}
            >
              Home
            </button>
            {loggedIn && (
              <>
                <button
                  onClick={() => onRoute("favourites")}
                  className={`${brand.btn} ${brand.ghost}`}
                >
                  Favourites
                </button>
                <button
                  onClick={() => onRoute("upload")}
                  className={`${brand.btn} ${brand.primary} flex items-center gap-2`}
                >
                  <Upload className="h-4 w-4" /> Upload
                </button>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {!loggedIn ? (
            <button
              onClick={onLogin}
              className={`${brand.btn} ${brand.subtle} flex items-center gap-2`}
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors"
              >
                <div className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-300 overflow-hidden">
                  {userProfileImage ? (
                    <img src={userProfileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-5 w-5 text-slate-700" />
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600" />
              </button>

              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{currentUser}</p>
                      <p className="text-xs text-slate-500">Manage your account</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onRoute("settings");
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-200"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {!loggedIn && (
            <div className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-300">
              <UserRound className="h-5 w-5 text-slate-700" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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

function RecipeCard({
  recipe,
  onLike,
  onFav,
  onOpen,
}: {
  recipe: Recipe;
  onLike: (id: string) => void;
  onFav: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const recipeId = recipe._id || recipe.id || "";
  const recipeImage = recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
  const recipeAuthor = recipe.author || "Anonymous";

  return (
    <article className={`flex gap-4 p-3 ${brand.card} ${brand.radius}`}>
      <img
        src={recipeImage}
        alt={recipe.name}
        className="h-24 w-24 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 truncate">{recipe.name}</h3>
        <p className="text-sm text-slate-600">by {recipeAuthor}</p>
        {recipe.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{recipe.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => onLike(recipeId)}
            className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}
          >
            <Heart
              className={`h-4 w-4 ${recipe.liked ? "fill-red-500 stroke-red-500" : ""}`}
            />{" "}
            Like
          </button>
          <button
            onClick={() => onFav(recipeId)}
            className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}
          >
            <Bookmark
              className={`h-4 w-4 ${recipe.favourite ? "fill-slate-800 stroke-slate-800" : ""}`}
            />{" "}
            Save
          </button>
          <button
            onClick={() => onOpen(recipeId)}
            className={`${brand.btn} ${brand.ghost} flex items-center gap-1`}
          >
            <MessageCircle className="h-4 w-4" /> Details
          </button>
        </div>
      </div>
    </article>
  );
}

function RecipeModal({
  recipe,
  onClose,
  onLike,
  onFav,
  onDelete,
  currentUser,
}: {
  recipe: Recipe | null;
  onClose: () => void;
  onLike: (id: string) => void;
  onFav: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUser?: string;
}) {
  if (!recipe) return null;

  const recipeId = recipe._id || recipe.id || "";
  const recipeImage = recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";
  const recipeAuthor = recipe.author || "Anonymous";
  const recipeAuthorId = recipe.authorId || recipe.author;
  const isOwner = currentUser && (recipeAuthorId === currentUser);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = () => {
    if (onDelete && recipeId) {
      onDelete(recipeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto ${brand.card} ${brand.radius} p-6 shadow-2xl`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        {/* Recipe Image */}
        <img
          src={recipeImage}
          alt={recipe.name}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />

        {/* Recipe Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{recipe.name}</h2>
          <p className="text-slate-600">by {recipeAuthor}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
          <button
            onClick={() => onLike(recipeId)}
            className={`${brand.btn} ${brand.ghost} flex items-center gap-2`}
          >
            <Heart
              className={`h-5 w-5 ${recipe.liked ? "fill-red-500 stroke-red-500" : ""}`}
            />
            {recipe.liked ? "Liked" : "Like"}
          </button>
          <button
            onClick={() => onFav(recipeId)}
            className={`${brand.btn} ${brand.ghost} flex items-center gap-2`}
          >
            <Bookmark
              className={`h-5 w-5 ${recipe.favourite ? "fill-slate-800 stroke-slate-800" : ""}`}
            />
            {recipe.favourite ? "Saved" : "Save"}
          </button>
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl font-medium bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-2 ml-auto"
            >
              <X className="h-5 w-5" />
              Delete Recipe
            </button>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to delete this recipe? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`${brand.btn} ${brand.subtle}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 leading-relaxed">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {recipe.steps && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Instructions</h3>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line">
              {recipe.steps}
            </div>
          </div>
        )}

        {/* Close button at bottom */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className={`${brand.btn} ${brand.primary}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthCard({
  mode = "login",
  onSwitch,
  onSuccess,
}: {
  mode?: "login" | "signup";
  onSwitch: () => void;
  onSuccess: (username: string) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        // Create user
        const response = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create account");
          setLoading(false);
          return;
        }

        onSuccess(username);
      } else {
        // Login
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setError(data.reason || data.error || "Invalid credentials");
          setLoading(false);
          return;
        }

        onSuccess(username);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className={`max-w-md w-full p-6 ${brand.card} ${brand.radius} shadow-xl`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === "login" ? "Login" : "Create an account"}
        </h2>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Username
      </label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={`mt-1 mb-3 w-full ${brand.input} ${brand.pill} px-4 py-2`}
        placeholder="your_username"
      />

      <label className="block text-sm font-medium text-slate-700">
        Password
      </label>
      <div className="relative mt-1 mb-4">
        <input
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && username && password) {
              handleSubmit();
            }
          }}
          className={`w-full ${brand.input} ${brand.pill} px-4 py-2`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShowPw((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700"
        >
          {showPw ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !username || !password}
        className={`w-full ${brand.btn} ${brand.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600 mt-3">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button onClick={onSwitch} className="underline underline-offset-2">
              Sign up
            </button>
            .
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={onSwitch} className="underline underline-offset-2">
              Log in
            </button>
            .
          </>
        )}
      </p>
    </div>
  );
}

function AuthPage({
  mode,
  onMode,
  onSuccess,
}: {
  mode: "login" | "signup";
  onMode: (m: "login" | "signup") => void;
  onSuccess: (username: string) => void;
}) {
  const bg =
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1400&auto=format&fit=crop";
  return (
    <div className="relative min-h-[calc(100vh-64px)] grid place-items-center">
      <img
        src={bg}
        className="absolute inset-0 h-full w-full object-cover"
        alt="Pasta"
      />
      <div className="absolute inset-0 bg-black/40" />
      <AuthCard
        mode={mode}
        onSwitch={() => onMode(mode === "login" ? "signup" : "login")}
        onSuccess={onSuccess}
      />
    </div>
  );
}

function ImageDrop({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (imageData: string | null) => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 ${brand.card} ${brand.radius}`}
    >
      <label
        className={`h-28 w-28 ${brand.radius} grid place-items-center border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 cursor-pointer hover:border-slate-400 transition-colors`}
      >
        {value ? (
          <img
            src={value}
            alt="preview"
            className="h-full w-full object-cover rounded-xl"
          />
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
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
              alert("Image must be less than 5MB");
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (ev) => onChange(String(ev.target?.result));
            reader.readAsDataURL(file);
          }}
          className="hidden"
        />
      </label>
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-2">
          JPG/PNG up to 5MB
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:text-red-700 underline"
          >
            Remove image
          </button>
        )}
      </div>
    </div>
  );
}

// --- Ingredient types & data ---
type Unit = "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "cup" | "piece";
interface PickedIngredient {
  name: string;
  quantity: number;
  unit: Unit;
}

const INGREDIENTS = [
  "Pasta",
  "Spaghetti",
  "Rice",
  "Egg",
  "Milk",
  "Butter",
  "Olive oil",
  "Chicken breast",
  "Beef mince",
  "Pork",
  "Salmon",
  "Tuna",
  "Shrimp",
  "Onion",
  "Garlic",
  "Tomato",
  "Tomato paste",
  "Cherry tomatoes",
  "Basil",
  "Parsley",
  "Coriander",
  "Lemon",
  "Lime",
  "Carrot",
  "Celery",
  "Bell pepper",
  "Spinach",
  "Broccoli",
  "Mushrooms",
  "Potato",
  "Sweet potato",
  "Flour",
  "Sugar",
  "Brown sugar",
  "Honey",
  "Salt",
  "Black pepper",
  "Paprika",
  "Cumin",
  "Chili flakes",
  "Soy sauce",
  "Vinegar",
  "Parmesan",
  "Cheddar",
  "Mozzarella",
  "Yogurt",
  "Cream",
  "Coconut milk",
  "Stock cube",
];

function classJoin(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function IngredientsPicker({
  value,
  onChange,
}: {
  value: PickedIngredient[];
  onChange: (next: PickedIngredient[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [selectedName, setSelectedName] = React.useState<string>("");

  const [qtyText, setQtyText] = React.useState<string>("");
  const [unit, setUnit] = React.useState<Unit>("g");

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const qtyRef = React.useRef<HTMLInputElement | null>(null);

  // Multi-select for existing pills
  const [selectedPills, setSelectedPills] = React.useState<Set<string>>(
    new Set(),
  );

  // Debounced query -> API call
  React.useEffect(() => {
    if (selectedName) return; // don't fetch while choosing qty/unit
    const q = query.trim();
    if (q.length < 2) {
      // hide pills until at least 2 chars
      setSuggestions([]);
      return;
    }

    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        const items: string[] = data?.items ?? [];
        // Filter out names we already added
        const existing = new Set(value.map((v) => v.name.toLowerCase()));
        setSuggestions(items.filter((n) => !existing.has(n.toLowerCase())));
      } catch {
        // ignore aborts / network blips
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query, selectedName, value]);

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

  const qty = Number(qtyText);
  function addIngredient() {
    if (!selectedName) return;
    if (!qty || qty <= 0) return;
    onChange([...value, {name: selectedName, quantity: qty, unit}]);
    resetAll();
  }

  function removeIngredient(name: string) {
    onChange(value.filter((v) => v.name.toLowerCase() !== name.toLowerCase()));
    setSelectedPills((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function togglePillSelection(name: string) {
    setSelectedPills((prev) => {
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
              if (
                e.key === "Enter" &&
                query.trim().length >= 2 &&
                suggestions.length === 1
              ) {
                e.preventDefault();
                chooseIngredient(suggestions[0]);
              }
            }}
            placeholder="Start typing an ingredient… (e.g., pasta)"
            className={`${brand.input} ${brand.pill} w-full px-4 py-2`}
          />

          {/* Show pills only once the user is typing */}
          {query.trim().length >= 2 && (
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
            Change
          </button>
        </div>
      )}

      {/* Quantity + Unit together; Enter in qty submits with current unit */}
      {selectedName && (
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
                if (
                  e.key === "Enter" &&
                  !!Number(qtyText) &&
                  Number(qtyText) > 0
                ) {
                  e.preventDefault();
                  addIngredient();
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
              {["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece"].map(
                (u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ),
              )}
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

      {/* Added ingredients as pills (multi-select wobble + delete) */}
      <div className="flex flex-wrap gap-2 mt-1">
        {value.length === 0 ? (
          <div className="text-sm text-slate-500">
            No ingredients added yet.
          </div>
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
                  isSelected ? "ring-2 ring-blue-400 animate-wobble" : "",
                ].join(" ")}
                title={`${ing.name} — ${ing.quantity} ${ing.unit}`}
              >
                <span className="pr-6">
                  {ing.name} — {ing.quantity} {ing.unit}
                </span>
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeIngredient(ing.name);
                    }}
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
          0%,
          100% {
            transform: rotate(-0.6deg) translateY(0);
          }
          50% {
            transform: rotate(0.6deg) translateY(-1px);
          }
        }
        .animate-wobble {
          animation: wobble 250ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function UploadPage({ currentUser, onPublish }: { currentUser: string; onPublish: () => void }) {
  const [ingredients, setIngredients] = useState<PickedIngredient[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    if (!name.trim()) {
      setError("Recipe name is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        ingredients: ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.quantity,
          unit: ing.unit,
        })),
        steps: steps.trim(),
        author: currentUser, // Display name
        authorId: currentUser, // Immutable user ID
        isPublic: true,
        image: imageData, // Include base64 image data
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create recipe");
        setLoading(false);
        return;
      }

      // Reset form
      setName("");
      setDescription("");
      setSteps("");
      setIngredients([]);
      setImageData(null);
      setLoading(false);
      
      alert("Recipe published successfully!");
      onPublish();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className={`p-6 ${brand.card} ${brand.radius}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="h-5 w-5" /> Upload a Recipe
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <ImageDrop value={imageData} onChange={setImageData} />

          {/* Name */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Recipe Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${brand.input} ${brand.pill} px-4 py-2`}
              placeholder="e.g., Garlic Butter Shrimp"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${brand.input} ${brand.radius} p-3`}
              placeholder="Short description of your recipe"
            />
          </div>

          {/* Ingredients (picker) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Ingredients
            </label>
            <IngredientsPicker value={ingredients} onChange={setIngredients} />
          </div>

          {/* Steps */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Steps</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={5}
              className={`${brand.input} ${brand.radius} p-3`}
              placeholder="1) Boil pasta..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={handlePublish}
              disabled={loading || !name.trim()}
              className={`${brand.btn} ${brand.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Publishing..." : "Publish"}
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
  onDelete,
  loading,
  userFavourites,
  userLikes,
  currentUser,
}: {
  loggedIn: boolean;
  items: Recipe[];
  onLike: (id: string) => void;
  onFav: (id: string) => void;
  onDelete?: (id: string) => void;
  loading: boolean;
  userFavourites: string[];
  userLikes: string[];
  currentUser?: string;
}) {
  const [q, setQ] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(s) || 
        (r.author && r.author.toLowerCase().includes(s)) ||
        (r.description && r.description.toLowerCase().includes(s))
    );
  }, [q, items]);

  // Merge userFavourites and userLikes into recipes
  const recipesWithUserData = useMemo(() => {
    return filtered.map((r) => ({
      ...r,
      favourite: userFavourites.includes(r._id || r.id || ""),
      liked: userLikes.includes(r._id || r.id || ""),
    }));
  }, [filtered, userFavourites, userLikes]);

  const handleOpenRecipe = (id: string) => {
    const recipe = recipesWithUserData.find((r) => (r._id || r.id) === id);
    if (recipe) setSelectedRecipe(recipe);
  };

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
      {loading ? (
        <div className={`p-6 ${brand.card} ${brand.radius} text-center text-slate-600`}>
          Loading recipes...
        </div>
      ) : recipesWithUserData.length === 0 ? (
        <div className={`p-6 ${brand.card} ${brand.radius} text-center text-slate-600`}>
          No recipes found.
        </div>
      ) : (
        <div className="grid gap-4">
          {recipesWithUserData.map((r) => (
            <RecipeCard
              key={r._id || r.id}
              recipe={r}
              onLike={onLike}
              onFav={onFav}
              onOpen={handleOpenRecipe}
            />
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onLike={onLike}
          onFav={onFav}
          onDelete={onDelete}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function FavouritesPage({
  loggedIn,
  items,
  onLike,
  onFav,
  onDelete,
  userFavourites,
  userLikes,
  currentUser,
}: {
  loggedIn: boolean;
  items: Recipe[];
  onLike: (id: string) => void;
  onFav: (id: string) => void;
  onDelete?: (id: string) => void;
  userFavourites: string[];
  userLikes: string[];
  currentUser?: string;
}) {
  const [q, setQ] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Filter items to only show user's favourites
  const favourites = useMemo(() => {
    return items.filter((r) => userFavourites.includes(r._id || r.id || ""));
  }, [items, userFavourites]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return favourites.filter(
      (r) =>
        r.name.toLowerCase().includes(s) || 
        (r.author && r.author.toLowerCase().includes(s)),
    );
  }, [q, favourites]);

  // Mark all as favourites and include likes for display
  const recipesWithUserData = useMemo(() => {
    return filtered.map((r) => ({ 
      ...r, 
      favourite: true,
      liked: userLikes.includes(r._id || r.id || ""),
    }));
  }, [filtered, userLikes]);

  const handleOpenRecipe = (id: string) => {
    const recipe = recipesWithUserData.find((r) => (r._id || r.id) === id);
    if (recipe) setSelectedRecipe(recipe);
  };

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

      {recipesWithUserData.length === 0 ? (
        <div className={`p-6 ${brand.card} ${brand.radius} text-slate-600`}>
          {loggedIn
            ? "You haven’t saved any recipes yet."
            : "Sign in to save favourites."}
        </div>
      ) : (
        <div className="grid gap-4">
          {recipesWithUserData.map((r) => (
            <RecipeCard
              key={r._id || r.id}
              recipe={r}
              onLike={onLike}
              onFav={onFav}
              onOpen={handleOpenRecipe}
            />
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onLike={onLike}
          onFav={onFav}
          onDelete={onDelete}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function SettingsPage({
  currentUser,
  userProfileImage,
  onUpdateProfile,
  onLogout,
}: {
  currentUser: string;
  userProfileImage?: string;
  onUpdateProfile: () => void;
  onLogout: () => void;
}) {
  const [profileImage, setProfileImage] = useState<string | null>(userProfileImage || null);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdateProfileImage = async () => {
    if (!profileImage) {
      setError("Please select an image");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${currentUser}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile image");
        setLoading(false);
        return;
      }

      setSuccess("Profile image updated successfully!");
      setLoading(false);
      onUpdateProfile();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError("Please enter a new username");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${currentUser}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update username");
        setLoading(false);
        return;
      }

      setSuccess("Username updated successfully! Logging you out...");
      setNewUsername("");
      setLoading(false);
      
      // Log out after 2 seconds
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${currentUser}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update password");
        setLoading(false);
        return;
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className={`p-6 ${brand.card} ${brand.radius} mb-6`}>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Account Settings
        </h2>
        <p className="text-sm text-slate-600">Manage your profile and account preferences</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Profile Image Section */}
      <div className={`p-6 ${brand.card} ${brand.radius} mb-4`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Picture
        </h3>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-slate-300 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center">
                <UserRound className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <ImageDrop value={profileImage} onChange={setProfileImage} />
            <button
              onClick={handleUpdateProfileImage}
              disabled={loading || !profileImage}
              className={`mt-3 ${brand.btn} ${brand.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Updating..." : "Update Profile Picture"}
            </button>
          </div>
        </div>
      </div>

      {/* Username Section */}
      <div className={`p-6 ${brand.card} ${brand.radius} mb-4`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Change Username
        </h3>
        <p className="text-sm text-slate-600 mb-4">Current username: <span className="font-medium">{currentUser}</span></p>
        <div className="grid gap-3">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            className={`${brand.input} ${brand.pill} px-4 py-2`}
          />
          <button
            onClick={handleUpdateUsername}
            disabled={loading || !newUsername.trim()}
            className={`${brand.btn} ${brand.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Updating..." : "Update Username"}
          </button>
          <p className="text-xs text-slate-500">Note: You will need to log in again after changing your username.</p>
        </div>
      </div>

      {/* Password Section */}
      <div className={`p-6 ${brand.card} ${brand.radius}`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h3>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={`w-full ${brand.input} ${brand.pill} px-4 py-2`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={`w-full ${brand.input} ${brand.pill} px-4 py-2`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={`w-full ${brand.input} ${brand.pill} px-4 py-2`}
            />
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className={`${brand.btn} ${brand.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Router ---
type Route = "home" | "upload" | "auth" | "favourites" | "settings";

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [userProfileImage, setUserProfileImage] = useState<string>("");

  // Lifted recipe state so Home & Favourites see the same data
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [userFavourites, setUserFavourites] = useState<string[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);

  // Helper functions for safe localStorage access
  const saveUserToStorage = (username: string) => {
    try {
      localStorage.setItem("currentUser", username);
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }
  };

  const removeUserFromStorage = () => {
    try {
      localStorage.removeItem("currentUser");
    } catch (err) {
      console.warn("Could not remove from localStorage:", err);
    }
  };

  // Restore auth state from localStorage on mount
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        setLoggedIn(true);
        setCurrentUser(savedUser);
      }
    } catch (err) {
      // localStorage might not be available (SSR, private browsing, etc.)
      console.warn("Could not access localStorage:", err);
    }
  }, []);

  // Fetch recipes on mount
  React.useEffect(() => {
    fetchRecipes();
  }, []);

  // Fetch user favourites, likes, and profile when logged in
  React.useEffect(() => {
    if (loggedIn && currentUser) {
      fetchUserFavourites();
      fetchUserLikes();
      fetchUserProfile();
    } else {
      setUserFavourites([]);
      setUserLikes([]);
      setUserProfileImage("");
    }
  }, [loggedIn, currentUser]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();
      
      if (response.ok) {
        // Filter out design documents and system docs
        const recipes = Array.isArray(data) 
          ? data.filter((r: Recipe) => !r._id?.startsWith("_design"))
          : [];
        setItems(recipes);
      }
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavourites = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/favourites?username=${currentUser}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserFavourites(data.favourites || []);
      }
    } catch (err) {
      console.error("Failed to fetch favourites:", err);
    }
  };

  const fetchUserLikes = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/likes?username=${currentUser}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserLikes(data.likes || []);
      }
    } catch (err) {
      console.error("Failed to fetch likes:", err);
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/accounts/${currentUser}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserProfileImage(data.profileImage || "");
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const toggleLike = async (id: string) => {
    if (!loggedIn || !currentUser) {
      alert("Please sign in to like recipes");
      return;
    }

    const isLiked = userLikes.includes(id);

    try {
      if (isLiked) {
        // Remove like
        const response = await fetch(
          `/api/likes?username=${currentUser}&recipeId=${id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setUserLikes((prev) => prev.filter((lId) => lId !== id));
        }
      } else {
        // Add like
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser, recipeId: id }),
        });

        if (response.ok) {
          setUserLikes((prev) => [...prev, id]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      alert("Failed to update like. Please try again.");
    }
  };

  const toggleFav = async (id: string) => {
    if (!loggedIn || !currentUser) {
      alert("Please sign in to save favourites");
      return;
    }

    const isFavourite = userFavourites.includes(id);

    try {
      if (isFavourite) {
        // Remove from favourites
        const response = await fetch(
          `/api/favourites?username=${currentUser}&recipeId=${id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setUserFavourites((prev) => prev.filter((fId) => fId !== id));
        }
      } else {
        // Add to favourites
        const response = await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser, recipeId: id }),
        });

        if (response.ok) {
          setUserFavourites((prev) => [...prev, id]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle favourite:", err);
      alert("Failed to update favourite. Please try again.");
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!loggedIn || !currentUser) {
      alert("Please sign in to delete recipes");
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${id}?username=${currentUser}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setItems((prev) => prev.filter((recipe) => (recipe._id || recipe.id) !== id));
        // Also remove from favourites and likes if present
        setUserFavourites((prev) => prev.filter((fId) => fId !== id));
        setUserLikes((prev) => prev.filter((lId) => lId !== id));
        alert("Recipe deleted successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete recipe");
      }
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    }
  };

  return (
    <div className={`${brand.bg} text-slate-900 min-h-screen`}>
      <Navbar
        loggedIn={loggedIn}
        onRoute={setRoute}
        onLogout={() => {
          setLoggedIn(false);
          setCurrentUser("");
          setUserProfileImage("");
          setRoute("home");
          removeUserFromStorage();
        }}
        onLogin={() => {
          setRoute("auth");
          setAuthMode("login");
        }}
        currentUser={currentUser}
        userProfileImage={userProfileImage}
      />

      {route === "auth" ? (
        <AuthPage
          mode={authMode}
          onMode={setAuthMode}
          onSuccess={(username) => {
            setLoggedIn(true);
            setCurrentUser(username);
            saveUserToStorage(username);
            setRoute("home");
          }}
        />
      ) : route === "upload" ? (
        loggedIn ? (
          <UploadPage 
            currentUser={currentUser}
            onPublish={() => {
              fetchRecipes();
              setRoute("home");
            }}
          />
        ) : (
          <AuthPage
            mode="login"
            onMode={setAuthMode}
            onSuccess={(username) => {
              setLoggedIn(true);
              setCurrentUser(username);
              saveUserToStorage(username);
              setRoute("upload");
            }}
          />
        )
      ) : route === "favourites" ? (
        <FavouritesPage
          loggedIn={loggedIn}
          items={items}
          onLike={toggleLike}
          userFavourites={userFavourites}
          userLikes={userLikes}
          onFav={toggleFav}
          onDelete={deleteRecipe}
          currentUser={currentUser}
        />
      ) : route === "settings" ? (
        loggedIn ? (
          <SettingsPage
            currentUser={currentUser}
            userProfileImage={userProfileImage}
            onUpdateProfile={fetchUserProfile}
            onLogout={() => {
              setLoggedIn(false);
              setCurrentUser("");
              setUserProfileImage("");
              setRoute("auth");
              setAuthMode("login");
              removeUserFromStorage();
            }}
          />
        ) : (
          <AuthPage
            mode="login"
            onMode={setAuthMode}
            onSuccess={(username) => {
              setLoggedIn(true);
              setCurrentUser(username);
              saveUserToStorage(username);
              setRoute("settings");
            }}
          />
        )
      ) : (
        <HomePage
          loggedIn={loggedIn}
          items={items}
          onLike={toggleLike}
          onFav={toggleFav}
          onDelete={deleteRecipe}
          loading={loading}
          userFavourites={userFavourites}
          userLikes={userLikes}
          currentUser={currentUser}
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
