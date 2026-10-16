"use client";

import { useEffect } from "react";
import type { ManagedProduct } from "../catalog-server";
import type { SiteTheme } from "../farmose-data";
import { startFarmose } from "./farmose-engine";

type Props = {
  products: ManagedProduct[];
  hiddenDesignSlugs: string[];
  theme: SiteTheme;
  initialRoute?: string;
};

/** The supplied layout is kept in React; its motion engine mounts into #view. */
export function FarmoseExperience({ products, hiddenDesignSlugs, theme, initialRoute = "home" }: Props) {
  useEffect(() => startFarmose({ products, hiddenDesignSlugs, theme, initialRoute }), [products, hiddenDesignSlugs, theme, initialRoute]);
  const logo = /^(\/(?!\/)|https:\/\/)/.test(theme.experienceLogoImage) ? theme.experienceLogoImage : "/farmose/img/logo.png";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="/farmose/site.css" />
      <header className="hdr">
        <div className="pill-row"><div className="lang"><button data-lang="kr" aria-label="Krio">KR</button><button data-lang="en" aria-label="English" className="on">EN</button></div></div>
        <a className="logo" href="#home" data-go="home" aria-label="Farmose home"><img src={logo} alt="Farmose" width="552" height="420" /></a>
        <div className="pill-row r"><button className="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu"><span className="lbl" id="menuLbl">Menu</span><span className="dot"><i /><span className="x">×</span></span></button></div>
      </header>
      <nav className="menu" id="menu" aria-label="Main">
        <ul>
          <li><a href="#home" data-go="home"><span data-i="home">Home</span><span className="d" /></a></li>
          <li><a href="#pantry" data-go="pantry"><span data-i="pantry">Pantry</span><span className="d" /></a></li>
          <li><a href="#production" data-go="production"><span data-i="production">Production</span><span className="d" /></a></li>
          <li><a href="#experience" data-go="experience"><span data-i="experience">Experience</span><span className="d" /></a></li>
        </ul>
        <div className="sub"><a href="#about" data-go="about" data-i="about">About</a><a href="#contacts" data-go="contacts" data-i="contacts">Contacts</a><a href="#basket" data-action="basket"><span data-i="shop">Shop</span> &#8599;</a></div>
      </nav>
      <main id="view" />
      <div className="cover intro" id="cover"><img className="mk" src={logo} alt="" /></div>
      <div className="cursor" id="cursor"><i /><span id="curTxt" /></div>
      <button className="bk-pill" id="bkPill" aria-label="Enquiry basket"><span data-i="enquiry">Enquiry</span><b id="bkN">0</b></button>
      <div className="bk-ov" id="bkOv" />
      <aside className="bk" id="bk" aria-label="Enquiry basket" aria-hidden="true"><div className="bk-h"><h3 data-i="enquiry">Enquiry</h3><button className="bk-x" id="bkX" aria-label="Close">×</button></div><div className="bk-list" id="bkList" /><div className="bk-f" id="bkF" /></aside>
      <div className="ck" id="ck"><span id="ckT" /><div><button className="btn" id="ckA" /><button className="btn" id="ckR" /></div></div>
      <div className="modal" id="modal"><div className="bx"><h3 data-i="privacy">Privacy &amp; Cookies</h3><p id="privTxt" /><button className="btn" id="modalClose" data-i="close">Close</button></div></div>
    </>
  );
}
