import styles from "@/styles/Badge.module.css";

export interface BadgeInterface {
    text: string;
    filled?: boolean;
}

export type BadgeProps = {
    items: BadgeInterface[];
    className?: string;
}

export default function Badge({ items, className }: BadgeProps) {
    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            {items.map((item) => (
                <div key={item.text} className={`${styles.badge} ${item.filled ? styles.filled : ''}`}>
                    {item.text}
                </div>
            ))}
        </div>
    )
}