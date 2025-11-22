/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package com.github.ruediste.lofi.xwiki;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;

import org.xwiki.component.annotation.Component;
import org.xwiki.icon.IconManager;
import org.xwiki.rendering.block.Block;
import org.xwiki.rendering.block.ParagraphBlock;
import org.xwiki.rendering.block.RawBlock;
import org.xwiki.rendering.macro.AbstractMacro;
import org.xwiki.rendering.macro.MacroExecutionException;
import org.xwiki.rendering.syntax.Syntax;
import org.xwiki.rendering.transformation.MacroTransformationContext;
import org.xwiki.skinx.SkinExtension;

/**
 * Example Macro.
 */
@Component
@Named("lo-fi-mockup")
@Singleton
public class ShowMockupPageMacro extends AbstractMacro<ShowMockupPageMacroParameters> {

    @Inject
    private LoFiService service;

    @Inject
    private IconManager iconManager;

    @Inject
    @Named("linkx")
    private SkinExtension linkx;

    /**
     * The description of the macro.
     */
    private static final String DESCRIPTION = "Render a page of a Lo Fi Mockup";

    /**
     * Create and initialize the descriptor of the macro.
     */
    public ShowMockupPageMacro() {
        super("Show LoFi Mockup", DESCRIPTION, ShowMockupPageMacroParameters.class);
    }

    /**
     * {@inheritDoc}
     * <relativePath>../</relativePath>
     * </parent>
     * 
     * @see org.xwiki.rendering.macro.Macro#execute(Object, String,
     *      MacroTransformationContext)
     */
    @Override
    public List<Block> execute(ShowMockupPageMacroParameters parameters, String content,
            MacroTransformationContext context)
            throws MacroExecutionException {
        try {
            linkx.use(service.getWebjarUrl() + "/xwiki.css", Map.of("type", "text/css", "rel", "stylesheet"));
            var attachment = parameters.getMockup().getName();

            List<Block> wordBlockAsList = List.of(new RawBlock(
                    "<div class=\"include-lo-fi-mockup-page\"><div class=\"actions\">"

                            + "<a href=\"" + service.getMockupPlayUrl(attachment, parameters.getPageNr() - 1) + "\" >"
                            + iconManager.renderHTML("play")
                            + "</a>"

                            + "<a href=\"" + service.getMockupEditUrl(attachment, parameters.getPageNr() - 1) + "\" >"
                            + iconManager.renderHTML("edit")
                            + "</a>"
                            + "</div> <img src=\""
                            + service.getPageImageUrl(attachment, parameters.getPageNr() - 1)
                            + "\"/></div>",
                    Syntax.XHTML_5));

            // Handle both inline mode and standalone mode.
            if (context.isInline()) {
                return wordBlockAsList;
            } else {
                // Wrap the result in a Paragraph Block since a WordBlock is an inline element
                // and it needs to be
                // inside a standalone block.
                return Arrays.<Block>asList(new ParagraphBlock(wordBlockAsList));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * {@inheritDoc}
     * 
     * @see org.xwiki.rendering.macro.Macro#supportsInlineMode()
     */
    public boolean supportsInlineMode() {
        return true;
    }

}
