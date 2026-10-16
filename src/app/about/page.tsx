import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";

export const metadata: Metadata = { title: "About", alternates: canonical("/about") };

export default function About() {
  return (
    <div className="container narrow page prose">
      <div className="eyebrow">About</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 300, margin: "8px 0 20px" }}>How teacher works</h1>
      <p>teacher is a quiet place to learn problem solving and software engineering, from zero. It has four tracks: DSA up to Codeforces Candidate Master, System Design, Low-Level Design in Java and C++, and AI Engineering.</p>
      <h2>What it will and won’t do</h2>
      <ul>
        <li>It will give you the ideas in small pieces, make you use each one immediately, and point you to the right problems.</li>
        <li>It won’t make you good by itself. Skill comes from solving many problems, giving contests, and reviewing your mistakes. There is no shortcut, and anyone who sells one is lying.</li>
      </ul>
      <h2>How to use a lesson</h2>
      <ol>
        <li>Work through it in <strong>Learn</strong> mode — one step at a time. Answer before you peek.</li>
        <li>Write your own notes in the notes panel. Copy the summary into your notebook.</li>
        <li>Mark it complete; its flashcards join your <Link href="/review">review</Link> deck.</li>
        <li>Solve at least the core problems. Then come back to the rest over the next weeks.</li>
      </ol>
      <h2>Keyboard</h2>
      <ul>
        <li><kbd>/</kbd> or <kbd>Ctrl</kbd> <kbd>K</kbd> — search</li>
        <li><kbd>F</kbd> — focus mode in a lesson, <kbd>Esc</kbd> to leave</li>
        <li><kbd>Space</kbd> then <kbd>1</kbd>–<kbd>4</kbd> — flip and grade a flashcard</li>
        <li><kbd>←</kbd> <kbd>→</kbd> — step through a visualizer</li>
      </ul>
      <h2>Data</h2>
      <p>Without an account, everything is stored in your browser. With an account, progress, notes and flashcards sync to the server. Codeforces sync reads only public data for the handle you enter.</p>
    </div>
  );
}
