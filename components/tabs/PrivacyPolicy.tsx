"use client";

import {useEffect, useState} from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {Button} from "@/components/ui/button";
import {createAndUpdatePrivacyAndPolicyServerSide, getPrivacyAndPolicyServerSide} from "@/server/functions/admin.fun";
import {toast} from "sonner";

export default function PrivacyPolicy() {
    const [content, setContent] = useState("");

    const handleChange = (value: string) => {
        setContent(value);
    };

    useEffect(() => {
        async function fatchPrivacy () {
            const conent = await getPrivacyAndPolicyServerSide().then( e=> e.data) as string;
            setContent(conent);
        }
        fatchPrivacy().then(r => console.log(r));
    },[])

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["blockquote", "code-block"],
            ["link", "image", "video"],
            ["clean"],
        ],
    };

    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "align",
        "list",
        "indent",
        "blockquote",
        "code-block",
        "link",
        "image",
        "video",
    ];

    const updateContent = async () => {
        const formData = new FormData() as FormData & { content: string };
        formData.append("content", content);

        await createAndUpdatePrivacyAndPolicyServerSide(formData);

        toast.success("Privacy policy updated");
    }

    return (
        <div className="w-[96%] mx-auto mt-4 h-[85vh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black p-6 md:p-8 flex flex-col gap-6 relative shadow-2xl">
            <div>
                <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
                    Privacy <span className="text-primary">&</span> Policy
                </h1>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    Manage storefront legal content in a dark editor workspace
                </p>
            </div>
            {/* Editor */}
            <ReactQuill
                theme="snow"
                value={content}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                className="privacy-editor w-full h-[88%]"
                placeholder="Write your terms and conditions here..."
            />
            <Button
                className="absolute bottom-8 right-8 h-[44px] rounded-full bg-primary px-6 text-black hover:bg-white cursor-pointer"
                onClick={()=> updateContent()}
            >
                Update
            </Button>

            <style jsx global>{`
                .privacy-editor .ql-toolbar {
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-bottom: none;
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 1.25rem 1.25rem 0 0;
                }

                .privacy-editor .ql-container {
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: #050505;
                    color: #ffffff;
                    border-radius: 0 0 1.25rem 1.25rem;
                    font-size: 14px;
                }

                .privacy-editor .ql-editor {
                    min-height: 420px;
                    color: #ffffff;
                }

                .privacy-editor .ql-editor.ql-blank::before {
                    color: rgba(255, 255, 255, 0.28);
                    font-style: normal;
                }

                .privacy-editor .ql-stroke {
                    stroke: rgba(255, 255, 255, 0.8);
                }

                .privacy-editor .ql-fill {
                    fill: rgba(255, 255, 255, 0.8);
                }

                .privacy-editor .ql-picker,
                .privacy-editor .ql-picker-label,
                .privacy-editor .ql-picker-item,
                .privacy-editor .ql-toolbar button {
                    color: #ffffff;
                }

                .privacy-editor .ql-toolbar button:hover,
                .privacy-editor .ql-toolbar button.ql-active,
                .privacy-editor .ql-toolbar .ql-picker-label:hover,
                .privacy-editor .ql-toolbar .ql-picker-label.ql-active {
                    color: #f59e0b;
                }

                .privacy-editor .ql-toolbar button:hover .ql-stroke,
                .privacy-editor .ql-toolbar button.ql-active .ql-stroke,
                .privacy-editor .ql-toolbar .ql-picker-label:hover .ql-stroke,
                .privacy-editor .ql-toolbar .ql-picker-label.ql-active .ql-stroke {
                    stroke: #f59e0b;
                }

                .privacy-editor .ql-toolbar button:hover .ql-fill,
                .privacy-editor .ql-toolbar button.ql-active .ql-fill {
                    fill: #f59e0b;
                }

                .privacy-editor .ql-picker-options {
                    background: #0b0b0b;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
}
