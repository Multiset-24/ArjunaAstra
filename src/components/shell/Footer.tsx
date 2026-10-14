import Link from "next/link";
import s from "./shell.module.css";

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <span>teacher — learn slowly, practise daily.</span>
        <span>
          <Link href="/about">About</Link> · <Link href="/profile">Settings</Link>
        </span>
      </div>
    </footer>
  );
}
