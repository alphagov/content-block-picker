declare module "*.njk" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: { readonly [className: string]: string };
  export default content;
}
