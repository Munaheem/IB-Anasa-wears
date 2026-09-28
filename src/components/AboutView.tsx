import React, { useState } from 'react';
import { MapPin, Clock, Truck, Phone, MessageCircle, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react';

export const AboutView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'HOW DO I PLACE AN ORDER?',
      a: 'Browse our online catalogue, select your desired garment and size, and click "ORDER VIA WHATSAPP" or add items to your Shopping Bag. Our dedicated styling concierge will immediately confirm live inventory, provide payment instructions, and dispatch your order.'
    },
    {
      q: 'WHERE IS THE PHYSICAL SHOWROOM LOCATED?',
      a: 'Our primary flagship showroom is located at Shop 7, Opp MTN Office, Auchi, Edo State, Nigeria. Walk-in clients are welcome Monday through Saturday between 9:00 AM and 6:00 PM.'
    },
    {
      q: 'HOW DOES NATIONWIDE DELIVERY OPERATE?',
      a: 'We provide same-day local courier delivery within Auchi and surrounding areas. For deliveries to Lagos, Abuja, Port Harcourt, Benin City, and all other states, we partner with verified logistics carriers with door-to-door tracking (2–4 working days).'
    },
    {
      q: 'CAN I REQUEST BESPOKE OR EXCLUSIVE SIZES?',
      a: 'Yes. If your size is out of stock or you desire a specific colourway/capsule drop, contact our WhatsApp concierge directly with reference images.'
    },
    {
      q: 'WHAT IS YOUR EXCHANGE AND RETURN POLICY?',
      a: 'We honor size exchanges within 7 business days of delivery on unworn items with all original tags attached. Custom or bespoke orders are non-refundable.'
    },
    {
      q: 'HOW DO I EARN LOYALTY POINTS?',
      a: 'Loyal customers can earn points for every purchase made through our website or in-store. These points can be redeemed for discounts on future orders.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-16">
      {/* Editorial Monograph */}
      <section className="border-b border-gray-200 pb-12 space-y-4">
        <div className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.25em] uppercase text-gray-500">
          <Sparkles size={12} className="text-black" />
          <span>HOUSE OF IB ANASA &middot; EST. AUCHI</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none text-black">
          Luxury Only. <br /> <span className="font-normal text-gray-400">Without Compromise.</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl">
          IB ANASA WEARS was founded on a singular premise: uncompromising sartorial distinction. 
          Situated in the heart of Auchi, Edo State, our showroom curates authentic luxury streetwear, 
          sculptural statement hoodies, tailored trousers, artisanal leather goods, and exclusive footwear 
          for discerning individuals across Nigeria.
        </p>
      </section>

      {/* Showroom & Logistics Information Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-200 pb-16">
        {/* Location */}
        <div className="bg-white p-6 border border-gray-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-black">
              Showroom Location
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Shop 7, Opp MTN Office<br />
              Auchi, Edo State, Nigeria<br />
              <span className="font-mono text-gray-500 mt-1 block">Direct: 0813 894 7979</span>
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=Auchi+Edo+State+Nigeria"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold tracking-widest uppercase text-black underline underline-offset-4 hover:text-gray-600"
          >
            Open in Google Maps &rarr;
          </a>
        </div>

        {/* Hours */}
        <div className="bg-white p-6 border border-gray-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-black">
              Opening Hours
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Monday &ndash; Saturday: 9:00 AM &ndash; 6:00 PM<br />
              Sunday: Private Appointments &amp; Restock<br />
              <span className="text-emerald-700 font-bold mt-1 block">Always Open on WhatsApp</span>
            </p>
          </div>
          <span className="text-[10px] font-mono text-gray-400 uppercase">
            Walk-ins Welcome Everyday
          </span>
        </div>

        {/* Logistics */}
        <div className="bg-white p-6 border border-gray-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
              <Truck size={16} />
            </div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-black">
              Nationwide Logistics
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Same-day delivery within Auchi.<br />
              2&ndash;4 business days nationwide via insured logistics with real-time dispatch tracking.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <ShieldCheck size={12} />
            <span>100% Insured Transit</span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-6">
        <div>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400">
            STORE DIRECTORY &amp; GUIDELINES
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="py-4">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <span className="text-xs font-bold tracking-[0.14em] uppercase text-black group-hover:text-gray-600 transition-colors">
                    {faq.q}
                  </span>
                  <span className="p-1 text-gray-400 group-hover:text-black transition-colors">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {isOpen && (
                  <p className="pt-3 text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl animate-in fade-in duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* WhatsApp Concierge Banner */}
      <section className="bg-black text-white p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-emerald-400">
            PERSONAL STYLING DESK
          </span>
          <h3 className="font-display font-bold text-2xl uppercase tracking-tight">
            Need styling advice or a custom order?
          </h3>
          <p className="text-xs text-gray-300 max-w-md">
            Connect directly with our showroom manager on WhatsApp for immediate sizing confirmation and photo proofs.
          </p>
        </div>

        <a
          href="https://wa.me/2348138947979?text=Hello%20IB%20Anasa%20Wears!%20I%20would%20like%20personal%20styling%20advice."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold text-xs tracking-[0.18em] uppercase hover:bg-emerald-700 transition-all shrink-0 cursor-pointer"
        >
          <MessageCircle size={15} />
          <span>Chat on WhatsApp (0813 894 7979)</span>
        </a>
      </section>
    </div>
  );
};
