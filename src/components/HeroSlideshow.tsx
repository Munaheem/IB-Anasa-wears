import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, MessageCircle } from 'lucide-react';
import { HERO_SLIDES } from '../data/initialData';

interface HeroSlideshowProps {
  onExploreCatalog: () => void;
}

export const HeroSlideshow: React.FC<HeroSlideshowProps> = ({ onExploreCatalog }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = () => {
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    startAutoPlay();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    startAutoPlay();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    startAutoPlay();
  };

  const activeSlideData = HERO_SLIDES[currentSlide];

  return (
    <section
      id="heroLookbookStage"
      className="relative w-full h-[92vh] sm:h-screen min-h-[640px] bg-black text-white overflow-hidden flex items-end"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Background Images with smooth crossfade and zoom */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.bg}
              alt={slide.title}
              className="w-full h-full object-cover object-center opacity-75 transform scale-100 transition-transform duration-[7000ms] ease-out"
            />
            {/* Cinematic architectural gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60" />
          </div>
        );
      })}

      {/* Hero Content Container */}
      <div className={`relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-8 ${
        currentSlide === 0 ? 'pb-12 sm:pb-20 pt-28' : 'pb-6 sm:pb-10 pt-28'
      }`}>
        {/* Editorial Text */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold tracking-[0.25em] uppercase text-gray-300">
            <span>{activeSlideData.tag}</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.92] tracking-tighter uppercase mb-2">
            {activeSlideData.title}
          </h1>
          <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium tracking-tight text-white/80 uppercase mb-4">
            {activeSlideData.subtitle}
          </div>

          <p className="text-gray-300 text-xs sm:text-sm md:text-base font-normal max-w-lg mb-8 leading-relaxed">
            {activeSlideData.lede}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="heroDiscoverCatalogBtn"
              onClick={onExploreCatalog}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-black font-bold text-[11px] tracking-[0.2em] uppercase hover:bg-gray-200 transition-all active:scale-98 cursor-pointer shadow-lg"
            >
              <span>Discover Catalogue</span>
              <ArrowUpRight size={14} />
            </button>

            <a
              id="heroWhatsappConciergeBtn"
              href="https://wa.me/2348138947979?text=Hello%20IB%20Anasa%20Wears!%20I%20would%20like%20to%20order%20from%20the%20lookbook."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent border border-white/40 text-white font-bold text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all cursor-pointer backdrop-blur-xs"
            >
              <MessageCircle size={14} />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>

        {/* Slideshow Navigation & Controls */}
        <div className="flex items-center gap-4 self-start md:self-end bg-black/40 backdrop-blur-md p-2 border border-white/15">
          <button
            id="heroPrevBtn"
            onClick={prevSlide}
            className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous featured look"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 px-1">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(idx)}
                className={`h-1.5 transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            id="heroNextBtn"
            onClick={nextSlide}
            className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Next featured look"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
