import styles from "@/styles/Card.module.css";
import type { BadgeInterface } from "./Badge.tsx";

export interface CardInterface {
    indiactor: string,
    badge?: BadgeInterface,
    image?: string,
    title: string,
    subtitle?: string,
    body: string,
}

export type CardProps = {
    items: CardInterface[];
    className?: string;
}

export default function Card({ items, className }: CardProps) {
    return (
        
    )
}