import logo from "../assets/logo.png";

function Navbar() {
    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Yuka Yantra logo" className="h-12 w-auto object-contain" />
                </div>

                <div className="flex-1 text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-emerald-700 sm:text-4xl">
                        Yuka Yantra Dashboard
                    </h1>
                </div>

                <div className="w-24" />
            </div>
        </header>
    );
}

export default Navbar;
