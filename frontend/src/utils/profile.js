export const getEntityProfileId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  return entity._id || entity.id || entity.userId || '';
};

export const getEntityDisplayName = (entity, fallback = 'Unknown') => {
  if (!entity) return fallback;
  if (typeof entity === 'string') return fallback;
  return entity.username || entity.name || fallback;
};
