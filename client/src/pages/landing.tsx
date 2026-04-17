const navLinks = [
  { label: "Enterprise", href: "#enterprise" },
  { label: "Services", href: "#services", hasCaret: true },
  { label: "About", href: "#about", hasCaret: true },
]

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(120,255,86,0.08),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(120,255,86,0.05),transparent_25%)]" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#00e05a]">
              <span className="flex h-3.5 w-5 flex-col justify-between">
                <span className="h-0.5 w-full rounded-full bg-black" />
                <span className="h-0.5 w-4 rounded-full bg-black" />
                <span className="h-0.5 w-3 rounded-full bg-black" />
              </span>
            </span>
            <span className="text-[1.05rem] font-semibold tracking-[-0.04em] text-white sm:text-xl">
              EasyHire
            </span>
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-[0.98rem] text-white/90 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
              >
                {link.label}
                {link.hasCaret ? <span className="text-xs leading-none">⌄</span> : null}
              </a>
            ))}
          </nav>

          <a
            href="/signin"
            className="inline-flex items-center justify-center rounded-2xl bg-[#f0f0f0] px-5 py-2.5 text-sm font-medium text-black transition-colors duration-200 hover:bg-white"
          >
            Login
          </a>
        </header>

        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[1600px] items-center px-5 pb-10 pt-10 sm:px-8 lg:px-14 lg:pt-0">
          <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-10 xl:gap-16">
            <div className="max-w-[680px]">
              <h1 className="max-w-[620px] font-playfair text-[clamp(3.2rem,6vw,5.8rem)] leading-[0.94] tracking-[-0.06em] text-white">
                Hire with confidence,
                <br />
                work with<span className="italic"> trust.</span>
              </h1>

              <p className="mt-8 max-w-[430px] text-[1.05rem] leading-8 text-white/75 sm:text-[1.12rem]">
                The first job-matching platform connecting trade-licensed businesses with verified local talent in a safe, transparent environment.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#00e05a] px-8 py-4 text-base font-medium text-black transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#19ef68]"
                >
                  Sign Up
                </a>
                <a
                  href="/signin"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-transparent px-8 py-4 text-base font-medium text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
                >
                  Login
                </a>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -right-8 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-[#00ff63]/10 blur-3xl" />
              <div className="absolute right-8 top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-[#8b2cff]/15 blur-3xl" />
              <img
                src="/hero.png"
                alt="Glowing abstract EasyHire visual"
                className="relative z-10 w-full max-w-[760px] object-contain drop-shadow-[0_0_40px_rgba(131,255,86,0.08)]"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
