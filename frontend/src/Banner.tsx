import "./Banner.css";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const Banner: React.FC<Props> = (props) => {
  return <input className="input-field" {...props} />;
};

export default Banner;