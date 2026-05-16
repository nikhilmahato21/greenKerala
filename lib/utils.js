export function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}
export function savings(orig, sale) {
  return formatPrice(orig - sale)
}
export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}
