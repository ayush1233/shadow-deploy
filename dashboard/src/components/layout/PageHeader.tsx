import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="page-header-text">
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="page-header-actions">{actions}</div>}
        </motion.div>
    );
}
