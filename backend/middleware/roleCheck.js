module.exports = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini' });
        }
        next();
    };
};
