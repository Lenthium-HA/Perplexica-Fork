import axios from 'axios';
import { htmlToText } from 'html-to-text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import pdfParse from 'pdf-parse';

export const getEnhancedDocumentsFromLinks = async ({ links }: { links: string[] }) => {
  const splitter = new RecursiveCharacterTextSplitter();

  let docs: Document[] = [];

  await Promise.all(
    links.map(async (link) => {
      link =
        link.startsWith('http://') || link.startsWith('https://')
          ? link
          : `https://${link}`;

      try {
        const res = await axios.get(link, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Perplexica/1.0)',
          }
        });

        const isPdf = res.headers['content-type'] === 'application/pdf';

        if (isPdf) {
          const pdfText = await pdfParse(res.data);
          const parsedText = pdfText.text
            .replace(/(\r\n|\n|\r)/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const splittedText = await splitter.splitText(parsedText);
          const title = 'PDF Document';

          const linkDocs = splittedText.map((text) => {
            return new Document({
              pageContent: text,
              metadata: {
                title: title,
                url: link,
              },
            });
          });

          docs.push(...linkDocs);
          return;
        }

        // Enhanced HTML processing with better content extraction
        const html = res.data.toString('utf8');
        const parsedText = htmlToText(html, {
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'script', options: { ignore: true } },
            { selector: 'style', options: { ignore: true } },
            { selector: 'nav', options: { ignore: true } },
            { selector: 'footer', options: { ignore: true } },
            { selector: 'header', options: { ignore: true } },
            { selector: '.sidebar', options: { ignore: true } },
            { selector: '.advertisement', options: { ignore: true } },
            { selector: 'main', options: { wordwrap: false } },
            { selector: 'article', options: { wordwrap: false } },
            { selector: '[role="main"]', options: { wordwrap: false } },
          ],
          preserveNewlines: true,
          wordwrap: false,
        })
          .replace(/(\r\n|\n|\r)/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const splittedText = await splitter.splitText(parsedText);
        const title = html.match(/<title.*>(.*?)<\/title>/i)?.[1] || 
                     html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ||
                     new URL(link).hostname;

        const linkDocs = splittedText.map((text) => {
          return new Document({
            pageContent: text,
            metadata: {
              title: title || link,
              url: link,
            },
          });
        });

        docs.push(...linkDocs);
      } catch (err) {
        console.error(
          'An error occurred while getting enhanced documents from links: ',
          err,
        );
        docs.push(
          new Document({
            pageContent: `Failed to retrieve content from the link: ${err}`,
            metadata: {
              title: 'Failed to retrieve content',
              url: link,
            },
          }),
        );
      }
    }),
  );

  return docs;
};