import { JSX } from "solid-js/jsx-runtime";

function IconUpload(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-line-cap="round"
            stroke-line-join="round"
            stroke-width="2"
            class="feather feather-upload"
            viewBox="0 0 24 24"
            {...props}
        >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
            <path d="M17 8L12 3 7 8"></path>
            <path d="M12 3L12 15"></path>
        </svg>
    );
}

export default IconUpload;