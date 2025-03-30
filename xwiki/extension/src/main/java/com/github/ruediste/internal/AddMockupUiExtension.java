package com.github.ruediste.internal;

import java.util.Map;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Provider;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.DocumentReference;
import org.xwiki.model.reference.DocumentReferenceResolver;
import org.xwiki.model.reference.SpaceReference;
import org.xwiki.rendering.block.Block;
import org.xwiki.rendering.block.RawBlock;
import org.xwiki.rendering.syntax.Syntax;
import org.xwiki.security.authorization.AuthorizationManager;
import org.xwiki.uiextension.UIExtension;

import groovy.lang.Singleton;

@Component
@Singleton
public class AddMockupUiExtension implements UIExtension {

    @Inject
    @Named("user")
    private DocumentReferenceResolver<String> resolver;

    @Inject
    Provider<SpaceReference> spaceReferenceProvider;

    @Override
    public String getId() {
        return getClass().getName();
    }

    @Override
    public String getExtensionPointId() {
        return "org.xwiki.plaftorm.moreoptions";
    }

    @Override
    public Map<String, String> getParameters() {
        return Map.of("order", "120000");
    }

    public DocumentReference getAuthorReference() {
        return new DocumentReference(AuthorizationManager.SUPERADMIN_USER, spaceReferenceProvider.get());
    }

    @Override
    public Block execute() {
        return new RawBlock(
                "<li><a href=\"/foo/bar\" title=\"Add LoFi Mockup\" rel=\"nofollow\">Add LoFi Mockup</a></li>",
                Syntax.XHTML_5);
    }

}