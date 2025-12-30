import React from "react";
import LoadingSVG from '../../assets/loading.svg'

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center" style={{ height: "90vh" }}>
      <div>
        <img className="mx-auto h-[150px] mb-3" src={LoadingSVG} alt="loading..." />
        <div className="flex items-center justify-center gap-3">
          <svg class="size-[25px] rounded-full animate-spin border-[2px] border-primary-400 border-dotted">
            {/* ... */}
          </svg>
          <h2 className="text-xl">Please wait, Loading...</h2>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;