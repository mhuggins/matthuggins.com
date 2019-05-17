import { shape, string } from "prop-types";

const companyShape = shape({
  location: string.isRequired,
  name: string.isRequired,
  url: string,
});

export default companyShape;
